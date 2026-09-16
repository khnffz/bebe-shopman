import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSummary } from '@/lib/reports/calculator'
import { Order } from '@/types/orders'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform') // 'all', 'shopee', 'tiktok'
    const shopId = searchParams.get('shop_id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const platforms = platform === 'all' ? ['shopee', 'tiktok'] : [platform as string]

    // 1. Try native database aggregation via RPC (much faster)
    try {
      const { data: rpcSummary, error: rpcError } = await supabase.rpc('get_report_summary', {
        p_user_id: user.id,
        p_platform: platform === 'all' ? null : platform,
        p_from: from || null,
        p_to: to || null,
        p_shop_id: shopId && shopId !== 'all' ? shopId : null,
      })

      if (!rpcError && rpcSummary) {
        return NextResponse.json({
          summary: {
            period: { from: from || '', to: to || '' },
            platforms,
            ...rpcSummary,
            serviceFees: {
              total: Number(rpcSummary.serviceFees?.total) || 0,
              transactionFee: Number(rpcSummary.serviceFees?.transactionFee) || 0,
              promoTrialFee: Number(rpcSummary.serviceFees?.promoTrialFee) || 0,
              promoServiceFee: Number(rpcSummary.serviceFees?.promoServiceFee) || 0,
            }
          },
        })
      }
    } catch (e) {
      console.warn('RPC get_report_summary failed, falling back to local calculator:', e)
    }

    // 2. Fallback to client query if RPC function has not been applied to PostgreSQL
    let query = supabase
      .from('orders')
      .select('platform, total_income, payment_settlement, adjustment_amount, product_price, refund_to_buyer, seller_voucher, seller_cashback_coin, platform_discount, cofund_voucher_seller, cofund_cashback_coin, platform_voucher, shipping_buyer, shipping_to_courier, shipping_discount_courier, shipping_free_platform, shipping_return, return_to_seller_fee, shipping_refund, admin_fee, processing_fee, free_shipping_special_d, free_shipping_normal_d, free_shipping_normal_e, free_shipping_normal_f, free_shipping_normal_g, free_shipping_normal_h, free_shipping_program_fee, service_transaction_fee, transaction_fee, service_promo_trial_fee, service_promo_fee, cashback_service_fee, campaign_fee, ads_commission_fee, gmv_max_ads_fee, auto_topup_fee, premium_fee, insurance_fee, fbs_fee, other_transaction_fee, affiliate_commission, affiliate_partner_commission, live_service_fee, paylater_fee, tokopedia_fee, tokopedia_handling_fee, dynamic_commission, pph22')
      .eq('user_id', user.id)

    if (from && to) {
      query = query.gte('order_date', from).lte('order_date', to)
    }

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform)
    }

    if (shopId && shopId !== 'all') {
      query = query.eq('shop_id', shopId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    const summary = calculateSummary(orders as Order[], from || '', to || '', platforms)

    return NextResponse.json({ summary })

  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
