import * as XLSX from 'xlsx'
import { parseNumeric, parseDateString } from './excel-utils'
import { Order, OrderItem } from '@/types/orders'

export function parseTiktokExcel(workbook: XLSX.WorkBook): { orders: Partial<Order>[], items: Partial<OrderItem>[] } {
  const orders: Partial<Order>[] = []
  const items: Partial<OrderItem>[] = []
  const seenOrderNumbers = new Set<string>()

  const sheetName = workbook.SheetNames.find(n => n.includes('Detail pesanan') || n.includes('detail pesanan'))
  if (!sheetName) return { orders, items }

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 82) continue

    let orderNumber = String(row[0]).trim()
    if (!orderNumber) continue

    // Handle duplicates (like "Penyesuaian" rows) by appending a suffix
    let suffix = 1
    let originalOrderNumber = orderNumber
    while (seenOrderNumbers.has(orderNumber)) {
      orderNumber = `${originalOrderNumber}-ADJ${suffix}`
      suffix++
    }
    
    seenOrderNumbers.add(orderNumber)
    orders.push({
      platform: 'tiktok',
      order_number: orderNumber,
        transaction_type: String(row[1]).trim(),
        order_date: parseDateString(row[2]) || new Date().toISOString(),
        payment_date: parseDateString(row[3]),
        currency: String(row[4]).trim() || 'IDR',
        
        payment_settlement: parseNumeric(row[5]),
        total_income: parseNumeric(row[6]),
        product_price_after_discount: parseNumeric(row[7]),
        product_price: parseNumeric(row[8]),
        seller_voucher: parseNumeric(row[9]),
        
        horison_product_fee: parseNumeric(row[10]),
        
        refund_to_buyer: parseNumeric(row[11]), // using subtotal after discount
        
        admin_fee: parseNumeric(row[15]),
        transaction_fee: parseNumeric(row[18]),
        credit_card_fee: parseNumeric(row[19]),
        
        shipping_to_courier: parseNumeric(row[20]),
        shipping_discount_courier: parseNumeric(row[21]),
        shipping_buyer: parseNumeric(row[25]),
        shipping_free_platform: parseNumeric(row[24]),
        shipping_return: parseNumeric(row[27]),
        shipping_refund: parseNumeric(row[26]),
        shipping_subsidy: parseNumeric(row[28]),
        horison_shipping_fee: parseNumeric(row[29]),
        logistics_service_fee: parseNumeric(row[30]),
        
        insurance_refund: parseNumeric(row[31]),
        
        affiliate_commission: parseNumeric(row[32]),
        affiliate_partner_commission: parseNumeric(row[33]),
        affiliate_shop_ads: parseNumeric(row[34]),
        affiliate_deposit: parseNumeric(row[35]),
        affiliate_refund: parseNumeric(row[36]),
        affiliate_partner_shop_ads: parseNumeric(row[37]),
        
        free_shipping_program_fee: parseNumeric(row[38]),
        dynamic_commission: parseNumeric(row[39]),
        cashback_service_fee: parseNumeric(row[40]),
        live_service_fee: parseNumeric(row[41]),
        exclusive_access_fee: parseNumeric(row[42]),
        processing_fee: parseNumeric(row[43]),
        eams_fee: parseNumeric(row[44]),
        flash_sale_fee: parseNumeric(row[45]),
        tokopedia_fee: parseNumeric(row[46]),
        tokopedia_handling_fee: parseNumeric(row[47]),
        paylater_fee: parseNumeric(row[48]),
        campaign_resource_fee: parseNumeric(row[49]),
        installation_fee: parseNumeric(row[50]),
        
        pph22: parseNumeric(row[51]),
        
        platform_special_fee: parseNumeric(row[52]),
        gmv_max_ads_fee: parseNumeric(row[53]),
        gmv_max_voucher: parseNumeric(row[54]),
        gmv_max_voucher_tax: parseNumeric(row[55]),
        managed_service_tax: parseNumeric(row[56]),
        managed_service_fee: parseNumeric(row[57]),
        failed_delivery_shipping: parseNumeric(row[58]),
        buyer_fault_return_shipping: parseNumeric(row[59]),
        insurance_fee: parseNumeric(row[60]),
        
        adjustment_amount: parseNumeric(row[62]),
        tiktok_related_order_id: String(row[63]).trim(),
        tiktok_buyer_payment: parseNumeric(row[64]),
        tiktok_buyer_refund: parseNumeric(row[65]),
        tiktok_seller_voucher_discount: parseNumeric(row[66]),
        tiktok_seller_voucher_refund: parseNumeric(row[67]),
        tiktok_platform_discount: parseNumeric(row[68]),
        tiktok_platform_discount_refund: parseNumeric(row[69]),
        tiktok_platform_voucher_discount: parseNumeric(row[70]),
        tiktok_platform_voucher_refund: parseNumeric(row[71]),
        tiktok_buyer_shipping_before_discount: parseNumeric(row[72]),
        tiktok_seller_shipping_discount: parseNumeric(row[73]),
        tiktok_platform_shipping: parseNumeric(row[74]),
        
        package_weight: parseNumeric(row[75]),
        chargeable_weight: parseNumeric(row[76]),
        order_source: String(row[78]).trim(),
        
        commission_before_discount: parseNumeric(row[79]),
        ads_spending_discount: parseNumeric(row[80]),
        other_commission_discount: parseNumeric(row[81])
      })

    // Expand product details
    const productDetailRaw = String(row[77]).trim()
    if (productDetailRaw && productDetailRaw !== '/') {
      const parts = productDetailRaw.split(';').filter(Boolean)
      parts.forEach(part => {
        const [productId, qtyStr] = part.split(' * ')
        const qty = parseInt(qtyStr, 10) || 1
        
        items.push({
          order_id: orderNumber as any, // Temp link
          platform_product_id: productId.trim(),
          product_name: null,
          quantity: qty,
          // TikTok doesn't provide item-level income details in this sheet
        })
      })
    }
  }

  return { orders, items }
}

export function parseTiktokOrdersExcel(workbook: XLSX.WorkBook): { orders: Partial<Order>[], items: Partial<OrderItem>[] } {
  const orders: Partial<Order>[] = []
  const items: Partial<OrderItem>[] = []
  const seenOrderNumbers = new Set<string>()

  const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('pesanan') || n.toLowerCase().includes('order'))
  if (!sheetName) return { orders, items }

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 60) continue

    let orderNumber = String(row[0]).trim()
    if (!orderNumber) continue

    // The order ID is the same for multiple SKUs in the same order.
    // We create the order once, and then add items.
    if (!seenOrderNumbers.has(orderNumber)) {
      seenOrderNumbers.add(orderNumber)
      
      orders.push({
        platform: 'tiktok',
        order_number: orderNumber,
        order_status: String(row[1]).trim(),
        order_substatus: String(row[2]).trim(),
        cancel_return_type: String(row[3]).trim(),
        
        order_date: parseDateString(row[29]) || new Date().toISOString(), // Created Time
        created_time: parseDateString(row[29]),
        paid_time: parseDateString(row[30]),
        rts_time: parseDateString(row[31]),
        shipped_time: parseDateString(row[32]),
        delivered_time: parseDateString(row[33]),
        cancelled_time: parseDateString(row[34]),
        cancel_by: String(row[35]).trim(),
        cancel_reason: String(row[36]).trim(),
        
        fulfillment_type: String(row[37]).trim(),
        warehouse_name: String(row[38]).trim(),
        tracking_id: String(row[39]).trim(),
        delivery_option: String(row[40]).trim(),
        courier_name: String(row[41]).trim(),
        buyer_message: String(row[42]).trim(),
        buyer_username: String(row[43]).trim(),
        recipient_name: String(row[44]).trim(),
        recipient_phone: String(row[45]).trim(),
        zipcode: String(row[46]).trim(),
        country: String(row[47]).trim(),
        province: String(row[48]).trim(),
        city: String(row[49]).trim(),
        district: String(row[50]).trim(),
        village: String(row[51]).trim(),
        detail_address: String(row[52]).trim(),
        additional_address: String(row[53]).trim(),
        
        payment_method: String(row[54]).trim(),
        package_id: String(row[57]).trim(),
        
        tokopedia_invoice_number: String(row[62]).trim(),
        order_channel: String(row[63]).trim(),
        creator_handle: String(row[64]).trim(),
      })
    }

    // Add item for this row
    items.push({
      order_id: orderNumber as any, // Temp link
      sku_id: String(row[5]).trim(),
      seller_sku: String(row[6]).trim(),
      product_name: String(row[7]).trim(),
      variation: String(row[8]).trim(),
      quantity: parseInt(String(row[9]), 10) || 1,
      qty_returned: parseInt(String(row[10]), 10) || 0,
      item_product_price: parseNumeric(row[11]),
      item_platform_discount: parseNumeric(row[13]),
      item_seller_voucher: parseNumeric(row[14]),
      weight_kg: parseNumeric(row[55]),
      product_category: String(row[56]).trim(),
    })
  }

  return { orders, items }
}

