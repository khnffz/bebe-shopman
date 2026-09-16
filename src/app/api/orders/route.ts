import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_SORT_COLUMNS = ['order_date', 'order_number', 'product_price', 'total_income']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const platform = searchParams.get('platform')
    const shopId = searchParams.get('shop_id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')?.trim()
    const sort = searchParams.get('sort') || 'order_date'
    const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
    const dataStatus = searchParams.get('data_status') // all, rp, i, both
    const orderStatus = searchParams.get('order_status')

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        platform,
        order_date,
        buyer_username,
        product_price,
        total_income,
        shop_id,
        order_status,
        sync_status_finance,
        sync_status_orders,
        shops (
          name
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform)
    }

    if (shopId && shopId !== 'all') {
      query = query.eq('shop_id', shopId)
    }

    if (from && to) {
      query = query.gte('order_date', from).lte('order_date', to)
    }

    if (dataStatus && dataStatus !== 'all') {
      if (dataStatus === 'rp') {
        query = query.eq('sync_status_finance', true).eq('sync_status_orders', false)
      } else if (dataStatus === 'i') {
        query = query.eq('sync_status_finance', false).eq('sync_status_orders', true)
      } else if (dataStatus === 'both') {
        query = query.eq('sync_status_finance', true).eq('sync_status_orders', true)
      }
    }

    if (orderStatus && orderStatus !== 'all') {
      query = query.eq('order_status', orderStatus)
    }

    if (search) {
      // Escape special characters for ilike
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&')
      query = query.or(`order_number.ilike.%${sanitizedSearch}%,buyer_username.ilike.%${sanitizedSearch}%`)
    }

    const sortColumn = ALLOWED_SORT_COLUMNS.includes(sort) ? sort : 'order_date'
    query = query.order(sortColumn, { ascending: dir === 'asc' })

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: rawOrders, error, count } = await query

    if (error) {
      console.error('Error fetching orders list:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    const orders = (rawOrders || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      platform: order.platform,
      order_date: order.order_date,
      buyer_username: order.buyer_username,
      product_price: order.product_price,
      total_income: order.total_income,
      shop_id: order.shop_id,
      shop_name: order.shops?.name || null,
      order_status: order.order_status,
      sync_status_finance: order.sync_status_finance,
      sync_status_orders: order.sync_status_orders,
    }))

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Orders route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
