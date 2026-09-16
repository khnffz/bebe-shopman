import { ReportSummary, Order } from '@/types/orders'

export function calculateSummary(orders: Partial<Order>[], fromDate: string, toDate: string, platforms: string[]): ReportSummary {
  const summary: ReportSummary = {
    period: { from: fromDate, to: toDate },
    platforms,
    totalRevenue: 0,
    subtotalOrders: { total: 0, productPrice: 0, refundToBuyer: 0 },
    voucherSubsidy: { total: 0, sellerVoucher: 0, sellerCashbackCoin: 0, platformDiscount: 0, cofundVoucherSeller: 0, cofundCashbackCoin: 0, platformVoucher: 0 },
    totalExpenses: 0,
    shippingCosts: { total: 0, buyerShipping: 0, toCourier: 0, courierDiscount: 0, freePlatform: 0, returnShipping: 0, returnToSellerFee: 0, shippingRefund: 0 },
    platformFees: { total: 0, adminFee: 0, processingFee: 0 },
    freeShippingFees: { total: 0, specialD: 0, normalD: 0, normalE: 0, normalF: 0, normalG: 0, normalH: 0, tiktokFreeShipping: 0 },
    serviceFees: { total: 0, transactionFee: 0, promoTrialFee: 0, promoServiceFee: 0 },
    promotionFees: { total: 0, campaignFee: 0, adsCommission: 0, autoTopup: 0 },
    otherFees: { total: 0, premiumFee: 0, fbsFee: 0, otherTransaction: 0, affiliateCommission: 0, liveServiceFee: 0, paylaterFee: 0, tokopediaFee: 0, dynamicCommission: 0 },
    tax: { total: 0, pph22: 0 },
    totalReleased: 0
  }

  for (const order of orders) {
    // 1. Total Pendapatan
    const productPrice = Number(order.product_price) || 0
    const refundToBuyer = Number(order.refund_to_buyer) || 0
    
    summary.subtotalOrders.productPrice += productPrice
    summary.subtotalOrders.refundToBuyer += refundToBuyer
    summary.subtotalOrders.total += (productPrice + refundToBuyer)

    const sellerVoucher = Number(order.seller_voucher) || 0
    const sellerCashbackCoin = Number(order.seller_cashback_coin) || 0
    const platformDiscount = Number(order.platform_discount) || 0
    const cofundVoucherSeller = Number(order.cofund_voucher_seller) || 0
    const cofundCashbackCoin = Number(order.cofund_cashback_coin) || 0
    const platformVoucher = Number(order.platform_voucher) || 0

    summary.voucherSubsidy.sellerVoucher += sellerVoucher
    summary.voucherSubsidy.sellerCashbackCoin += sellerCashbackCoin
    summary.voucherSubsidy.platformDiscount += platformDiscount
    summary.voucherSubsidy.cofundVoucherSeller += cofundVoucherSeller
    summary.voucherSubsidy.cofundCashbackCoin += cofundCashbackCoin
    summary.voucherSubsidy.platformVoucher += platformVoucher
    summary.voucherSubsidy.total += (sellerVoucher + sellerCashbackCoin + platformDiscount + cofundVoucherSeller + cofundCashbackCoin + platformVoucher)

    // 2. Total Pengeluaran
    
    // Ongkos Kirim
    const buyerShipping = Number(order.shipping_buyer) || 0
    const toCourier = Number(order.shipping_to_courier) || 0
    const courierDiscount = Number(order.shipping_discount_courier) || 0
    const freePlatform = Number(order.shipping_free_platform) || 0
    const returnShipping = Number(order.shipping_return) || 0
    const returnToSellerFee = Number(order.return_to_seller_fee) || 0
    const shippingRefund = Number(order.shipping_refund) || 0

    summary.shippingCosts.buyerShipping += buyerShipping
    summary.shippingCosts.toCourier += toCourier
    summary.shippingCosts.courierDiscount += courierDiscount
    summary.shippingCosts.freePlatform += freePlatform
    summary.shippingCosts.returnShipping += returnShipping
    summary.shippingCosts.returnToSellerFee += returnToSellerFee
    summary.shippingCosts.shippingRefund += shippingRefund
    summary.shippingCosts.total += (buyerShipping + toCourier + courierDiscount + freePlatform + returnShipping + returnToSellerFee + shippingRefund)

    // Biaya Platform
    const adminFee = Number(order.admin_fee) || 0
    const processingFee = Number(order.processing_fee) || 0
    
    summary.platformFees.adminFee += adminFee
    summary.platformFees.processingFee += processingFee
    summary.platformFees.total += (adminFee + processingFee)

    // Biaya Gratis Ongkir
    const specialD = Number(order.free_shipping_special_d) || 0
    const normalD = Number(order.free_shipping_normal_d) || 0
    const normalE = Number(order.free_shipping_normal_e) || 0
    const normalF = Number(order.free_shipping_normal_f) || 0
    const normalG = Number(order.free_shipping_normal_g) || 0
    const normalH = Number(order.free_shipping_normal_h) || 0
    const tiktokFreeShipping = Number(order.free_shipping_program_fee) || 0
    
    summary.freeShippingFees.specialD += specialD
    summary.freeShippingFees.normalD += normalD
    summary.freeShippingFees.normalE += normalE
    summary.freeShippingFees.normalF += normalF
    summary.freeShippingFees.normalG += normalG
    summary.freeShippingFees.normalH += normalH
    summary.freeShippingFees.tiktokFreeShipping += tiktokFreeShipping
    summary.freeShippingFees.total += (specialD + normalD + normalE + normalF + normalG + normalH + tiktokFreeShipping)

    // Biaya Layanan
    const transactionFee = Number(order.service_transaction_fee) || Number(order.transaction_fee) || 0
    const promoTrialFee = Number(order.service_promo_trial_fee) || 0
    const promoServiceFee = Number(order.service_promo_fee) || Number(order.cashback_service_fee) || 0
    
    summary.serviceFees.transactionFee += transactionFee
    summary.serviceFees.promoTrialFee += promoTrialFee
    summary.serviceFees.promoServiceFee += promoServiceFee
    summary.serviceFees.total += (transactionFee + promoTrialFee + promoServiceFee)

    // Biaya Promosi
    const campaignFee = Number(order.campaign_fee) || 0
    const adsCommission = Number(order.ads_commission_fee) || 0
    const autoTopup = Number(order.auto_topup_fee) || 0
    
    summary.promotionFees.campaignFee += campaignFee
    summary.promotionFees.adsCommission += adsCommission
    summary.promotionFees.autoTopup += autoTopup
    summary.promotionFees.total += (campaignFee + adsCommission + autoTopup)

    // Biaya Lainnya
    const premiumFee = Number(order.premium_fee) || 0
    const fbsFee = Number(order.fbs_fee) || 0
    const otherTransaction = Number(order.other_transaction_fee) || 0
    
    // TikTok Specific
    const affiliateCommission = (Number(order.affiliate_commission) || 0) + (Number(order.affiliate_partner_commission) || 0)
    const liveServiceFee = Number(order.live_service_fee) || 0
    const paylaterFee = Number(order.paylater_fee) || 0
    const tokopediaFee = (Number(order.tokopedia_fee) || 0) + (Number(order.tokopedia_handling_fee) || 0)
    const dynamicCommission = Number(order.dynamic_commission) || 0
    
    summary.otherFees.premiumFee += premiumFee
    summary.otherFees.fbsFee += fbsFee
    summary.otherFees.otherTransaction += otherTransaction
    summary.otherFees.affiliateCommission += affiliateCommission
    summary.otherFees.liveServiceFee += liveServiceFee
    summary.otherFees.paylaterFee += paylaterFee
    summary.otherFees.tokopediaFee += tokopediaFee
    summary.otherFees.dynamicCommission += dynamicCommission
    summary.otherFees.total += (premiumFee + fbsFee + otherTransaction + affiliateCommission + liveServiceFee + paylaterFee + tokopediaFee + dynamicCommission)

    // Pajak
    const pph22 = Number(order.pph22) || 0
    
    summary.tax.pph22 += pph22
    summary.tax.total += pph22

    // Revenue, Expenses, and Released calculation
    const income = Number(order.total_income) || 0
    summary.totalRevenue += income

    if (order.platform === 'tiktok') {
      const tiktokGross = income
      const tiktokSettlement = Number(order.payment_settlement) || 0
      const tiktokAdjustment = Number(order.adjustment_amount) || 0
      
      const tiktokExpenses = tiktokSettlement - tiktokGross - tiktokAdjustment

      summary.totalExpenses += tiktokExpenses
      summary.totalReleased += tiktokSettlement
    } else {
      // Shopee
      summary.totalReleased += income

      const orderShipping = buyerShipping + toCourier + courierDiscount + freePlatform + returnShipping + returnToSellerFee + shippingRefund
      const orderPlatform = adminFee + processingFee
      const orderFreeShipping = specialD + normalD + normalE + normalF + normalG + normalH
      const orderServices = transactionFee + promoTrialFee + promoServiceFee
      const orderPromotions = campaignFee + adsCommission + autoTopup
      const orderOther = premiumFee + fbsFee + otherTransaction
      const orderTax = pph22

      summary.totalExpenses += (orderShipping + orderPlatform + orderFreeShipping + orderServices + orderPromotions + orderOther + orderTax)
    }
  }

  return summary
}
