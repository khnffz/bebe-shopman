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
    } else if (sheetNames.some(n => n.toLowerCase().includes('pesanan') || n.toLowerCase().includes('order'))) {
      platform = 'tiktok'
    } else {
      return NextResponse.json({ error: 'Format file tidak dikenali. Pastikan file pesanan yang diunggah valid.' }, { status: 400 })
    }

    if (platform === 'shopee') {
      return NextResponse.json({ error: 'Import pesanan (proses) Shopee belum didukung di versi ini.' }, { status: 400 })
    }

    const { parseTiktokOrdersExcel } = await import('@/lib/parsers/tiktok-parser')
    const { orders, items } = parseTiktokOrdersExcel(workbook)
      
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
      sync_status_orders: true
    }))

    // Find existing orders to merge
    const orderNumbers = processedOrders.map(o => o.order_number as string)
    const existingOrdersMap = new Map<string, string>() // order_number -> id
    
    const CHUNK_SIZE = 150
    for (let i = 0; i < orderNumbers.length; i += CHUNK_SIZE) {
      const chunk = orderNumbers.slice(i, i + CHUNK_SIZE)
      const { data, error: checkError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .in('order_number', chunk)

      if (checkError) {
        console.error('Error checking existing orders:', checkError)
        await supabase.from('import_batches').update({ status: 'failed', error_message: checkError.message }).eq('id', batch.id)
        return NextResponse.json({ error: 'Gagal mengecek duplikasi pesanan' }, { status: 500 })
      }
      
      data?.forEach(o => existingOrdersMap.set(o.order_number, o.id))
    }

    const ordersToInsert = []
    const ordersToUpdate = []

    for (const o of processedOrders) {
      if (existingOrdersMap.has(o.order_number as string)) {
        // Prepare update object (exclude import_batch_id so we don't mess up original batch mapping if needed, 
        // or actually update it to the latest batch for tracking process import)
        ordersToUpdate.push({
          ...o,
          id: existingOrdersMap.get(o.order_number as string)
        })
      } else {
        ordersToInsert.push(o)
      }
    }

    let insertedOrderIds = new Map<string, string>()

    // Insert new orders
    if (ordersToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('orders')
        .insert(ordersToInsert)
        .select('id, order_number')

      if (insertError) {
        console.error('Error inserting orders:', insertError)
        await supabase.from('import_batches').update({ status: 'failed', error_message: insertError.message }).eq('id', batch.id)
        return NextResponse.json({ error: 'Gagal menyimpan pesanan baru' }, { status: 500 })
      }
      insertedData?.forEach(o => insertedOrderIds.set(o.order_number, o.id))
    }

    // Update existing orders
    if (ordersToUpdate.length > 0) {
      // Supabase JS upsert is the easiest way to do bulk update if we provide the primary key 'id'
      const { error: updateError } = await supabase
        .from('orders')
        .upsert(ordersToUpdate, { onConflict: 'id', ignoreDuplicates: false })

      if (updateError) {
        console.error('Error updating orders:', updateError)
        await supabase.from('import_batches').update({ status: 'failed', error_message: updateError.message }).eq('id', batch.id)
        return NextResponse.json({ error: 'Gagal mengupdate pesanan' }, { status: 500 })
      }
    }

    // Map inserted order IDs to items based on order_number
    // We only insert items for the newly inserted orders, or do we insert items for updated too?
    // If we update, the order_items might already exist. We should upsert order_items as well.
    const allOrderIdsMap = new Map([...existingOrdersMap, ...insertedOrderIds])
    
    // For items, we will delete existing ones for updated orders to avoid duplicates (assuming process import has better item data)
    // BUT WAIT: if we delete items, we lose the item_total_income and financial fields on order_items!
    // Since TikTok process import has items, but NO finance data on item level, it's safe for TikTok (TikTok finance doesn't have item-level finance).
    // Let's just upsert items based on order_id and sku_id. Oh wait, order_items has no unique constraint on order_id + sku_id.
    // Given the constraints, let's just insert items if it's a NEW order, or if we want to update, we can find and update.
    // For simplicity, we just delete items for these updated orders and re-insert them, because currently TikTok Finance DOES NOT populate item-level finance (see parseTiktokExcel comment).
    if (ordersToUpdate.length > 0) {
       const idsToDelete = ordersToUpdate.map(o => o.id)
       for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
          await supabase.from('order_items').delete().in('order_id', idsToDelete.slice(i, i + CHUNK_SIZE))
       }
    }

    const processedItems = items.map(i => ({
      ...i,
      order_id: allOrderIdsMap.get(i.order_id as unknown as string),
      shop_id: shopId
    })).filter(i => i.order_id)

    // Insert order items
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
      message: `Berhasil import ${ordersToInsert.length} pesanan baru dan memperbarui ${ordersToUpdate.length} pesanan yang sudah ada.`
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
