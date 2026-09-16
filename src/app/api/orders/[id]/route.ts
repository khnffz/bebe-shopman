import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, shops(name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
    }

    const formattedOrder = {
      ...order,
      shop_name: order.shops?.name || null,
    }

    return NextResponse.json({
      order: formattedOrder,
      items: items || [],
    })
  } catch (error: any) {
    console.error('Order detail route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify order ownership
    const { data: order, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    // Delete associated order items
    const { error: itemsDeleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (itemsDeleteError) {
      console.error('Error deleting order items:', itemsDeleteError)
      return NextResponse.json({ error: 'Gagal menghapus item pesanan' }, { status: 500 })
    }

    // Delete the order
    const { error: orderDeleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (orderDeleteError) {
      console.error('Error deleting order:', orderDeleteError)
      return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Pesanan berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
