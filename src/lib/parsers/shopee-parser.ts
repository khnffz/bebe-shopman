import * as XLSX from 'xlsx'
import { parseNumeric, parseDateString } from './excel-utils'
import { Order, OrderItem } from '@/types/orders'

// Maps Shopee column header text -> Order/OrderItem field name
// Only used to build a dynamic col index map from the header row
const ORDER_COL_MAP: Record<string, keyof Order | string> = {
  'No. Pesanan':                                    'order_number',
  'No. Pengajuan':                                  'application_number',
  'Waktu Pesanan Dibuat':                           'order_date',
  'Tanggal Dana Dilepaskan':                        'payment_date',
  'Metode Pelepasan Dana':                          'release_method',
  'Tipe Pesanan':                                   'transaction_type',
  'Total Penghasilan':                              'total_income',
  'Harga Produk':                                   'product_price',
  'Jumlah Pengembalian Dana ke Pembeli':            'refund_to_buyer',
  'Ongkir Dibayar Pembeli':                         'shipping_buyer',
  'Ongkos Kirim yang Dibayarkan ke Jasa Kirim':    'shipping_to_courier',
  'Potongan Ongkos Kirim dari Jasa Kirim':         'shipping_discount_courier',
  'Gratis Ongkir dari Shopee':                      'shipping_free_platform',
  'Ongkos Kirim Pengembalian Barang':               'shipping_return',
  'Return to Seller Fee':                           'return_to_seller_fee',
  'Pengembalian Biaya Kirim':                       'shipping_refund',
  'Voucher disponsor oleh Penjual':                 'seller_voucher',
  'Cashback Koin disponsori Penjual':               'seller_cashback_coin',
  'Diskon Produk dari Shopee':                      'platform_discount',
  'Voucher co-fund disponsor oleh Penjual':         'cofund_voucher_seller',
  'Cashback Koin Co-fund disponsori Penjual':       'cofund_cashback_coin',
  'Biaya Administrasi':                             'admin_fee',
  'Biaya Proses Pesanan':                           'processing_fee',
  'Biaya Gratis Ongkir XTRA - Ukuran Khusus (Kategori D)': 'free_shipping_special_d',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori D)':  'free_shipping_normal_d',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori E)':  'free_shipping_normal_e',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori F)':  'free_shipping_normal_f',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori G)':  'free_shipping_normal_g',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori H)':  'free_shipping_normal_h',
  'Biaya Transaksi':                                '__biaya_transaksi__', // handled specially (two cols share this name)
  'Biaya Layanan Promo XTRA (Promo XTRA+ Free Trial)': 'service_promo_trial_fee',
  'Biaya Layanan Promo XTRA (Free Trial)':          'service_promo_trial_fee',
  'Biaya Layanan Promo XTRA':                       'service_promo_fee',
  'Biaya Kampanye':                                 'campaign_fee',
  'Biaya Komisi AMS':                               'ads_commission_fee',
  'Biaya Isi Saldo Otomatis (dari Penghasilan)':    'auto_topup_fee',
  'Biaya Isi Saldo Otomatis':                       'auto_topup_fee',
  'Premi':                                          'premium_fee',
  'FBS Fee':                                        'fbs_fee',
  'PPh 22':                                         'pph22',
  'Username (Pembeli)':                             'buyer_username',
  'Jumlah Dibayar Pembeli':                         'buyer_payment_amount',
  'Metode pembayaran pembeli':                      'payment_method',
  'Rincian Metode Pembayaran':                      'payment_detail',
  'Rencana Cicilan (jika berlaku)':                 'installment_plan',
  'Promo Gratis Ongkir dari Penjual':               'seller_free_shipping_promo',
  'Jasa Kirim':                                     'courier_service',
  'Nama Kurir':                                     'courier_name',
  'Kode Voucher':                                   'voucher_code',
  'Kompensasi':                                     'compensation',
  'Pengembalian Dana ke Pembeli':                   'refund_coin_prorate',       // first of refund group
  'Pro-rata Koin yang Ditukarkan untuk Pengembalian Barang': 'refund_coin_prorate',
  'Pro-rata Voucher Shopee untuk Pengembalian Barang':       'refund_voucher_prorate',
  'Pro-rated Bank Payment Channel Promotion for return refund Items': 'refund_bank_promo_prorate',
  'Pro-rated Shopee Payment Channel Promotion  for return refund Items': 'refund_shopee_promo_prorate',
}

// Item-level column mapping (Sku rows)
const ITEM_COL_MAP: Record<string, string> = {
  'ID Produk':                                      'platform_product_id',
  'Nama Produk':                                    'product_name',
  'Total Penghasilan':                              'item_total_income',
  'Harga Produk':                                   'item_product_price',
  'Jumlah Pengembalian Dana ke Pembeli':            'item_refund',
  'Ongkir Dibayar Pembeli':                         'item_shipping_buyer',
  'Ongkos Kirim yang Dibayarkan ke Jasa Kirim':    'item_shipping_to_courier',
  'Potongan Ongkos Kirim dari Jasa Kirim':         'item_shipping_discount',
  'Gratis Ongkir dari Shopee':                      'item_shipping_free_platform',
  'Ongkos Kirim Pengembalian Barang':               'item_shipping_return',
  'Return to Seller Fee':                           'item_return_to_seller_fee',
  'Pengembalian Biaya Kirim':                       'item_shipping_refund',
  'Voucher disponsor oleh Penjual':                 'item_seller_voucher',
  'Cashback Koin disponsori Penjual':               'item_seller_cashback',
  'Diskon Produk dari Shopee':                      'item_platform_discount',
  'Voucher co-fund disponsor oleh Penjual':         'item_cofund_voucher',
  'Cashback Koin Co-fund disponsori Penjual':       'item_cofund_cashback',
  'Biaya Administrasi':                             'item_admin_fee',
  'Biaya Proses Pesanan':                           'item_processing_fee',
  'Biaya Gratis Ongkir XTRA - Ukuran Khusus (Kategori D)': 'item_free_shipping_special_d',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori D)':  'item_free_shipping_normal_d',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori E)':  'item_free_shipping_normal_e',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori F)':  'item_free_shipping_normal_f',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori G)':  'item_free_shipping_normal_g',
  'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori H)':  'item_free_shipping_normal_h',
  'Biaya Layanan Promo XTRA (Promo XTRA+ Free Trial)': 'item_service_promo_trial_fee',
  'Biaya Layanan Promo XTRA (Free Trial)':          'item_service_promo_trial_fee',
  'Biaya Layanan Promo XTRA':                       'item_service_promo_fee',
  'Biaya Kampanye':                                 'item_campaign_fee',
  'Biaya Komisi AMS':                               'item_ads_commission_fee',
  'Biaya Isi Saldo Otomatis (dari Penghasilan)':    'item_auto_topup_fee',
  'Biaya Isi Saldo Otomatis':                       'item_auto_topup_fee',
  'Premi':                                          'item_premium_fee',
  'FBS Fee':                                        'item_fbs_fee',
  'PPh 22':                                         'item_pph22',
}

/**
 * Build a col-name → index map from the sub-header row (row index 2).
 * "Biaya Transaksi" appears twice: first = service_transaction_fee, second = other_transaction_fee.
 */
function buildColMap(headerRow: any[]): Record<string, number> {
  const map: Record<string, number> = {}
  let biayaTransaksiCount = 0

  for (let i = 0; i < headerRow.length; i++) {
    const name = String(headerRow[i]).trim()
    if (!name) continue

    if (name === 'Biaya Transaksi') {
      biayaTransaksiCount++
      if (biayaTransaksiCount === 1) {
        map['service_transaction_fee'] = i
      } else {
        map['other_transaction_fee'] = i
      }
      continue
    }

    // Use ORDER_COL_MAP first, then ITEM_COL_MAP
    const orderField = ORDER_COL_MAP[name]
    if (orderField && orderField !== '__biaya_transaksi__' && !(orderField in map)) {
      map[orderField as string] = i
    }
    const itemField = ITEM_COL_MAP[name]
    if (itemField && !(itemField in map)) {
      map[itemField] = i
    }
    // Always store by raw header name too for direct lookup
    if (!(name in map)) {
      map[name] = i
    }
  }
  return map
}

function getNum(row: any[], map: Record<string, number>, field: string): number {
  const idx = map[field]
  return idx !== undefined ? parseNumeric(row[idx]) : 0
}

function getStr(row: any[], map: Record<string, number>, field: string): string {
  const idx = map[field]
  return idx !== undefined ? String(row[idx] ?? '').trim() : ''
}

export function parseShopeeExcel(workbook: XLSX.WorkBook): { orders: Partial<Order>[], items: Partial<OrderItem>[] } {
  const orders: Partial<Order>[] = []
  const items: Partial<OrderItem>[] = []

  const targetSheets = workbook.SheetNames.filter(n => /^penghasilan/i.test(n.trim()))

  for (const sheetName of targetSheets) {
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

    // Row 0 = "Laporan Penghasilan" title, Row 1 = group headers, Row 2 = sub-headers (column names)
    if (data.length < 3) continue
    const colMap = buildColMap(data[2])

    for (let i = 3; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 10) continue

      const rowType = String(row[1]).trim()
      if (!rowType) continue

      const orderNumber = String(row[2]).trim()

      if (rowType === 'Order') {
        const freeShippingSpecialD = getNum(row, colMap, 'free_shipping_special_d')
        const freeShippingNormalD  = getNum(row, colMap, 'free_shipping_normal_d')
        const freeShippingNormalE  = getNum(row, colMap, 'free_shipping_normal_e')
        const freeShippingNormalF  = getNum(row, colMap, 'free_shipping_normal_f')
        const freeShippingNormalG  = getNum(row, colMap, 'free_shipping_normal_g')
        const freeShippingNormalH  = getNum(row, colMap, 'free_shipping_normal_h')

        orders.push({
          platform: 'shopee',
          order_number: orderNumber,
          application_number: getStr(row, colMap, 'application_number'),
          order_date: parseDateString(row[colMap['order_date']]) || new Date().toISOString(),
          payment_date: parseDateString(row[colMap['payment_date']]),
          release_method: getStr(row, colMap, 'release_method'),
          transaction_type: getStr(row, colMap, 'transaction_type'),
          order_type: getStr(row, colMap, 'transaction_type'),

          total_income: getNum(row, colMap, 'total_income'),
          product_price: getNum(row, colMap, 'product_price'),
          refund_to_buyer: getNum(row, colMap, 'refund_to_buyer'),

          shipping_buyer: getNum(row, colMap, 'shipping_buyer'),
          shipping_to_courier: getNum(row, colMap, 'shipping_to_courier'),
          shipping_discount_courier: getNum(row, colMap, 'shipping_discount_courier'),
          shipping_free_platform: getNum(row, colMap, 'shipping_free_platform'),
          shipping_return: getNum(row, colMap, 'shipping_return'),
          return_to_seller_fee: getNum(row, colMap, 'return_to_seller_fee'),
          shipping_refund: getNum(row, colMap, 'shipping_refund'),

          seller_voucher: getNum(row, colMap, 'seller_voucher'),
          seller_cashback_coin: getNum(row, colMap, 'seller_cashback_coin'),
          platform_discount: getNum(row, colMap, 'platform_discount'),
          cofund_voucher_seller: getNum(row, colMap, 'cofund_voucher_seller'),
          cofund_cashback_coin: getNum(row, colMap, 'cofund_cashback_coin'),

          admin_fee: getNum(row, colMap, 'admin_fee'),
          processing_fee: getNum(row, colMap, 'processing_fee'),

          free_shipping_fee: freeShippingSpecialD + freeShippingNormalD + freeShippingNormalE + freeShippingNormalF + freeShippingNormalG + freeShippingNormalH,
          free_shipping_special_d: freeShippingSpecialD,
          free_shipping_normal_d:  freeShippingNormalD,
          free_shipping_normal_e:  freeShippingNormalE,
          free_shipping_normal_f:  freeShippingNormalF,
          free_shipping_normal_g:  freeShippingNormalG,
          free_shipping_normal_h:  freeShippingNormalH,

          service_transaction_fee: getNum(row, colMap, 'service_transaction_fee'),
          service_promo_trial_fee: getNum(row, colMap, 'service_promo_trial_fee'),
          service_promo_fee: getNum(row, colMap, 'service_promo_fee'),
          campaign_fee: getNum(row, colMap, 'campaign_fee'),
          ads_commission_fee: getNum(row, colMap, 'ads_commission_fee'),
          auto_topup_fee: getNum(row, colMap, 'auto_topup_fee'),
          premium_fee: getNum(row, colMap, 'premium_fee'),
          fbs_fee: getNum(row, colMap, 'fbs_fee'),
          other_transaction_fee: getNum(row, colMap, 'other_transaction_fee'),

          pph22: getNum(row, colMap, 'pph22'),

          buyer_username: getStr(row, colMap, 'buyer_username'),
          buyer_payment_amount: getNum(row, colMap, 'buyer_payment_amount'),
          payment_method: getStr(row, colMap, 'payment_method'),
          payment_detail: getStr(row, colMap, 'payment_detail'),
          installment_plan: getStr(row, colMap, 'installment_plan'),

          seller_free_shipping_promo: getNum(row, colMap, 'seller_free_shipping_promo'),
          courier_service: getStr(row, colMap, 'courier_service'),
          courier_name: getStr(row, colMap, 'courier_name'),
          voucher_code: getStr(row, colMap, 'voucher_code'),

          compensation: getNum(row, colMap, 'compensation'),

          refund_coin_prorate: getNum(row, colMap, 'refund_coin_prorate'),
          refund_voucher_prorate: getNum(row, colMap, 'refund_voucher_prorate'),
          refund_bank_promo_prorate: getNum(row, colMap, 'refund_bank_promo_prorate'),
          refund_shopee_promo_prorate: getNum(row, colMap, 'refund_shopee_promo_prorate'),
        })
      } else if (rowType === 'Sku') {
        items.push({
          order_id: orderNumber as any,

          platform_product_id: getStr(row, colMap, 'platform_product_id'),
          product_name: getStr(row, colMap, 'product_name'),
          quantity: 1,

          item_total_income: getNum(row, colMap, 'item_total_income'),
          item_product_price: getNum(row, colMap, 'item_product_price'),
          item_refund: getNum(row, colMap, 'item_refund'),

          item_shipping_buyer: getNum(row, colMap, 'item_shipping_buyer'),
          item_shipping_to_courier: getNum(row, colMap, 'item_shipping_to_courier'),
          item_shipping_discount: getNum(row, colMap, 'item_shipping_discount'),
          item_shipping_free_platform: getNum(row, colMap, 'item_shipping_free_platform'),
          item_shipping_return: getNum(row, colMap, 'item_shipping_return'),
          item_return_to_seller_fee: getNum(row, colMap, 'item_return_to_seller_fee'),
          item_shipping_refund: getNum(row, colMap, 'item_shipping_refund'),

          item_seller_voucher: getNum(row, colMap, 'item_seller_voucher'),
          item_seller_cashback: getNum(row, colMap, 'item_seller_cashback'),
          item_platform_discount: getNum(row, colMap, 'item_platform_discount'),
          item_cofund_voucher: getNum(row, colMap, 'item_cofund_voucher'),
          item_cofund_cashback: getNum(row, colMap, 'item_cofund_cashback'),

          item_admin_fee: getNum(row, colMap, 'item_admin_fee'),
          item_processing_fee: getNum(row, colMap, 'item_processing_fee'),
          item_free_shipping_special_d: getNum(row, colMap, 'item_free_shipping_special_d'),
          item_free_shipping_normal_d:  getNum(row, colMap, 'item_free_shipping_normal_d'),
          item_free_shipping_normal_e:  getNum(row, colMap, 'item_free_shipping_normal_e'),
          item_free_shipping_normal_f:  getNum(row, colMap, 'item_free_shipping_normal_f'),
          item_free_shipping_normal_g:  getNum(row, colMap, 'item_free_shipping_normal_g'),
          item_free_shipping_normal_h:  getNum(row, colMap, 'item_free_shipping_normal_h'),
          item_service_transaction_fee: getNum(row, colMap, 'service_transaction_fee'),
          item_service_promo_trial_fee: getNum(row, colMap, 'item_service_promo_trial_fee'),
          item_service_promo_fee: getNum(row, colMap, 'item_service_promo_fee'),
          item_campaign_fee: getNum(row, colMap, 'item_campaign_fee'),
          item_ads_commission_fee: getNum(row, colMap, 'item_ads_commission_fee'),
          item_auto_topup_fee: getNum(row, colMap, 'item_auto_topup_fee'),
          item_premium_fee: getNum(row, colMap, 'item_premium_fee'),
          item_fbs_fee: getNum(row, colMap, 'item_fbs_fee'),
          item_other_transaction_fee: getNum(row, colMap, 'other_transaction_fee'),
          item_pph22: getNum(row, colMap, 'item_pph22'),

          item_application_number: getStr(row, colMap, 'application_number'),
        })
      }
    }
  }

  return { orders, items }
}
