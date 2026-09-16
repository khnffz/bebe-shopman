import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { parseShopeeExcel } from '@/lib/parsers/shopee-parser'
import { parseTiktokExcel } from '@/lib/parsers/tiktok-parser'
import { Order, OrderItem } from '@/types/orders'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const shopId = (formData.get('shop_id') as string) || null
    const overwrite = formData.get('overwrite') === 'true'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    let platform: 'shopee' | 'tiktok'
    const sheetNames = workbook.SheetNames
    
    if (sheetNames.some(n => /^penghasilan/i.test(n.trim()))) {
      platform = 'shopee'
    } else if (sheetNames.some(n => n.toLowerCase().includes('detail pesanan'))) {
      platform = 'tiktok'
    } else {
      return NextResponse.json({ error: 'Format file tidak dikenali. Pastikan file Shopee memiliki sheet "Penghasilan" atau TikTok memiliki sheet "Detail pesanan".' }, { status: 400 })
    }

    const { orders, items } = platform === 'shopee' 
      ? parseShopeeExcel(workbook) 
      : parseTiktokExcel(workbook)
      
    if (orders.length === 0) {
      return NextResponse.json({ error: 'Data pesanan tidak ditemukan' }, { status: 400 })
    }

    const periodStart = orders.reduce((min, o) => o.order_date! < min ? o.order_date! : min, orders[0].order_date!)
    const periodEnd = orders.reduce((max, o) => o.order_date! > max ? o.order_date! : max, orders[0].order_date!)

    // Create import batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        user_id: user.id,
        shop_id: shopId,
        platform,
        filename: file.name,
        period_start: periodStart,
        period_end: periodEnd,
        total_orders: orders.length,
        total_items: items.length,
        status: 'processing'
      })
      .select()
      .single()

    if (batchError || !batch) {
      console.error('Error creating batch:', batchError)
      return NextResponse.json({ error: 'Gagal membuat batch import' }, { status: 500 })
    }

    // Assign batch ID, shop ID, and user ID to orders
    const processedOrders = orders.map(o => ({
      ...o,
      import_batch_id: batch.id,
      user_id: user.id,
      shop_id: shopId,
      sync_status_finance: true
    }))

    // Check for existing orders to avoid duplicates - CHUNKED to prevent 414 URI Too Large
    const orderNumbers = processedOrders.map(o => o.order_number as string)
    const existingSet = new Set<string>()
    
    const CHUNK_SIZE = 150
    for (let i = 0; i < orderNumbers.length; i += CHUNK_SIZE) {
      const chunk = orderNumbers.slice(i, i + CHUNK_SIZE)
      const { data, error: checkError } = await supabase
        .from('orders')
        .select('order_number')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .in('order_number', chunk)

      if (checkError) {
        console.error('Error checking existing orders:', checkError)
        await supabase.from('import_batches').update({ status: 'failed', error_message: checkError.message }).eq('id', batch.id)
        return NextResponse.json({ error: 'Gagal mengecek duplikasi pesanan' }, { status: 500 })
      }
      
      data?.forEach(o => existingSet.add(o.order_number))
    }

    if (!overwrite) {
      const newOrders = processedOrders.filter(o => !existingSet.has(o.order_number as string))

      if (newOrders.length === 0) {
        // All orders already exist, skip inserting
        await supabase.from('import_batches').update({ status: 'completed', total_orders: 0, total_items: 0 }).eq('id', batch.id)
        return NextResponse.json({ 
          success: true, 
          batchId: batch.id, 
          totalOrders: 0, 
          totalItems: 0,
          platform,
          message: 'Semua pesanan di file ini sudah pernah di-import (diabaikan). Centang "Timpa data lama" untuk memperbarui data yang ada.'
        })
      }
      processedOrders.splice(0, processedOrders.length, ...newOrders)
    } else if (existingSet.size > 0) {
      // Overwrite mode: delete existing orders (cascade deletes items too) then re-insert
      const existingNumbers = [...existingSet]
      for (let i = 0; i < existingNumbers.length; i += CHUNK_SIZE) {
        const chunk = existingNumbers.slice(i, i + CHUNK_SIZE)
        await supabase
          .from('orders')
          .delete()
          .eq('user_id', user.id)
          .eq('platform', platform)
          .in('order_number', chunk)
      }
    }

    // Insert all orders (in overwrite mode existing ones are already deleted)
    const { data: insertedOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(processedOrders)
      .select('id, order_number')

    if (ordersError || !insertedOrders) {
      console.error('Error inserting orders:', ordersError)
      await supabase.from('import_batches').update({ status: 'failed', error_message: ordersError?.message }).eq('id', batch.id)
      return NextResponse.json({ error: 'Gagal menyimpan pesanan' }, { status: 500 })
    }

    // Map inserted order IDs to items based on order_number
    const orderNumberToIdMap = new Map(insertedOrders.map(o => [o.order_number, o.id]))
    const processedItems = items.map(i => ({
      ...i,
      order_id: orderNumberToIdMap.get(i.order_id as unknown as string),
      shop_id: shopId
    })).filter(i => i.order_id)

    // Insert order items in chunks to avoid large payload errors
    if (processedItems.length > 0) {
      const chunkSize = 1000
      for (let i = 0; i < processedItems.length; i += chunkSize) {
        const chunk = processedItems.slice(i, i + chunkSize)
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(chunk)
          
        if (itemsError) {
          console.error('Error inserting order items:', itemsError)
          await supabase.from('import_batches').update({ status: 'failed', error_message: itemsError.message }).eq('id', batch.id)
          return NextResponse.json({ error: 'Gagal menyimpan detail pesanan' }, { status: 500 })
        }
      }
    }

    // Mark batch as completed
    await supabase.from('import_batches').update({ 
      status: 'completed',
      total_orders: processedOrders.length,
      total_items: processedItems.length
    }).eq('id', batch.id)

    return NextResponse.json({ 
      success: true, 
      batchId: batch.id, 
      totalOrders: processedOrders.length, 
      totalItems: processedItems.length,
      platform,
      message: overwrite
        ? `Berhasil memperbarui ${processedOrders.length} pesanan.`
        : (existingSet.size > 0 
          ? `Berhasil import ${processedOrders.length} pesanan baru. (${existingSet.size} pesanan diabaikan karena sudah ada)`
          : undefined)
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
