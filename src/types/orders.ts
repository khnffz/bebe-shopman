export interface ImportBatch {
  id: string
  user_id: string
  shop_id?: string | null
  platform: 'shopee' | 'tiktok'
  filename: string
  period_start: string | null
  period_end: string | null
  total_orders: number
  total_items: number
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  shop_id?: string | null
  import_batch_id: string
  platform: 'shopee' | 'tiktok'
  order_number: string
  transaction_type: string | null
  order_date: string
  payment_date: string | null
  
  total_income: number
  product_price: number
  product_price_after_discount: number
  payment_settlement: number
  refund_to_buyer: number

  seller_voucher: number
  seller_cashback_coin: number
  platform_discount: number
  cofund_voucher_seller: number
  cofund_cashback_coin: number
  platform_voucher: number

  shipping_buyer: number
  shipping_to_courier: number
  shipping_discount_courier: number
  shipping_free_platform: number
  shipping_return: number
  return_to_seller_fee: number
  shipping_refund: number
  shipping_subsidy: number

  admin_fee: number
  processing_fee: number
  transaction_fee: number
  free_shipping_fee: number
  free_shipping_special_d: number
  free_shipping_normal_d: number
  free_shipping_normal_e: number
  free_shipping_normal_f: number
  free_shipping_normal_g: number
  free_shipping_normal_h: number

  service_transaction_fee: number
  service_promo_fee: number
  service_promo_trial_fee: number

  campaign_fee: number
  ads_commission_fee: number
  auto_topup_fee: number

  premium_fee: number
  fbs_fee: number
  other_transaction_fee: number

  affiliate_commission: number
  affiliate_partner_commission: number
  affiliate_shop_ads: number
  affiliate_deposit: number
  affiliate_refund: number
  affiliate_partner_shop_ads: number
  free_shipping_program_fee: number
  dynamic_commission: number
  cashback_service_fee: number
  live_service_fee: number
  exclusive_access_fee: number
  eams_fee: number
  flash_sale_fee: number
  tokopedia_fee: number
  tokopedia_handling_fee: number
  paylater_fee: number
  campaign_resource_fee: number
  installation_fee: number
  platform_special_fee: number
  gmv_max_ads_fee: number
  gmv_max_voucher: number
  gmv_max_voucher_tax: number
  managed_service_tax: number
  managed_service_fee: number
  failed_delivery_shipping: number
  buyer_fault_return_shipping: number
  insurance_fee: number
  logistics_service_fee: number
  insurance_refund: number
  credit_card_fee: number
  horison_product_fee: number
  horison_shipping_fee: number
  shipping_replacement: number
  shipping_exchange: number

  pph22: number

  buyer_username: string | null
  buyer_payment_amount: number
  payment_method: string | null
  payment_detail: string | null
  installment_plan: string | null

  seller_free_shipping_promo: number
  courier_service: string | null
  courier_name: string | null
  voucher_code: string | null

  compensation: number

  refund_coin_prorate: number
  refund_voucher_prorate: number
  refund_bank_promo_prorate: number
  refund_shopee_promo_prorate: number

  currency: string
  tiktok_related_order_id: string | null
  tiktok_buyer_payment: number
  tiktok_buyer_refund: number
  tiktok_seller_voucher_discount: number
  tiktok_seller_voucher_refund: number
  tiktok_platform_discount: number
  tiktok_platform_discount_refund: number
  tiktok_platform_voucher_discount: number
  tiktok_platform_voucher_refund: number
  tiktok_buyer_shipping_before_discount: number
  tiktok_seller_shipping_discount: number
  tiktok_platform_shipping: number
  package_weight: number
  chargeable_weight: number
  order_source: string | null
  commission_before_discount: number
  ads_spending_discount: number
  other_commission_discount: number
  adjustment_amount: number

  release_method: string | null
  order_type: string | null
  application_number: string | null

  // Order process & shipping fields
  order_status?: string | null
  order_substatus?: string | null
  cancel_return_type?: string | null
  created_time?: string | null
  paid_time?: string | null
  rts_time?: string | null
  shipped_time?: string | null
  delivered_time?: string | null
  cancelled_time?: string | null
  cancel_by?: string | null
  cancel_reason?: string | null
  tracking_id?: string | null
  delivery_option?: string | null
  package_id?: string | null
  fulfillment_type?: string | null
  warehouse_name?: string | null
  buyer_message?: string | null
  recipient_name?: string | null
  recipient_phone?: string | null
  zipcode?: string | null
  country?: string | null
  province?: string | null
  city?: string | null
  district?: string | null
  village?: string | null
  detail_address?: string | null
  additional_address?: string | null
  order_channel?: string | null
  creator_handle?: string | null
  tokopedia_invoice_number?: string | null
  sync_status_finance?: boolean
  sync_status_orders?: boolean

  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  shop_id?: string | null

  platform_product_id: string | null
  sku_id?: string | null
  seller_sku?: string | null
  variation?: string | null
  product_name: string | null
  quantity: number
  qty_returned?: number
  product_category?: string | null
  weight_kg?: number

  item_total_income: number
  item_product_price: number
  item_refund: number

  item_shipping_buyer: number
  item_shipping_to_courier: number
  item_shipping_discount: number
  item_shipping_free_platform: number
  item_shipping_return: number
  item_return_to_seller_fee: number
  item_shipping_refund: number

  item_seller_voucher: number
  item_seller_cashback: number
  item_platform_discount: number
  item_cofund_voucher: number
  item_cofund_cashback: number

  item_admin_fee: number
  item_processing_fee: number
  item_free_shipping_special_d: number
  item_free_shipping_normal_d: number
  item_free_shipping_normal_e: number
  item_free_shipping_normal_f: number
  item_free_shipping_normal_g: number
  item_free_shipping_normal_h: number
  item_service_transaction_fee: number
  item_service_promo_trial_fee: number
  item_service_promo_fee: number
  item_campaign_fee: number
  item_ads_commission_fee: number
  item_auto_topup_fee: number
  item_premium_fee: number
  item_fbs_fee: number
  item_other_transaction_fee: number
  item_pph22: number

  item_application_number: string | null

  created_at: string
}

export interface ReportSummary {
  period: { from: string; to: string }
  platforms: string[]
  
  totalRevenue: number
  subtotalOrders: {
    total: number
    productPrice: number
    refundToBuyer: number
  }
  voucherSubsidy: {
    total: number
    sellerVoucher: number
    sellerCashbackCoin: number
    platformDiscount: number
    cofundVoucherSeller: number
    cofundCashbackCoin: number
    platformVoucher: number
  }

  totalExpenses: number
  shippingCosts: {
    total: number
    buyerShipping: number
    toCourier: number
    courierDiscount: number
    freePlatform: number
    returnShipping: number
    returnToSellerFee: number
    shippingRefund: number
  }
  platformFees: {
    total: number
    adminFee: number
    processingFee: number
  }
  freeShippingFees: {
    total: number
    specialD: number
    normalD: number
    normalE: number
    normalF: number
    normalG: number
    normalH: number
    tiktokFreeShipping: number
  }
  serviceFees: {
    total: number
    transactionFee: number
    promoTrialFee: number
    promoServiceFee: number
  }
  promotionFees: {
    total: number
    campaignFee: number
    adsCommission: number
    autoTopup: number
  }
  otherFees: {
    total: number
    premiumFee: number
    fbsFee: number
    otherTransaction: number
    affiliateCommission: number
    liveServiceFee: number
    paylaterFee: number
    tokopediaFee: number
    dynamicCommission: number
  }
  tax: {
    total: number
    pph22: number
  }
  
  totalReleased: number
}
