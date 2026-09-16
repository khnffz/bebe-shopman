import { ReportSummary } from '@/types/orders'

interface ReportSummaryTableProps {
  summary: ReportSummary | null
  isLoading: boolean
}

export function ReportSummaryTable({ summary, isLoading }: ReportSummaryTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-[400px] animate-pulse bg-gray-50/50" />
      </div>
    )
  }

  if (!summary) return null

  const formatValue = (value: number | undefined | null) => {
    const num = Number(value) || 0
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(num)).replace('Rp', '').trim()

    if (num < 0) {
      return `(${formatted})`
    }
    return formatted
  }

  const renderRow = (
    label: string,
    value: number | undefined | null,
    level: 'primary' | 'secondary' | 'tertiary' = 'tertiary',
    isTotal: boolean = false
  ) => {
    const indentMap = {
      primary: 'pl-4',
      secondary: 'pl-8 text-gray-700',
      tertiary: 'pl-12 text-gray-500 text-sm',
    }

    const valueClass = isTotal ? 'font-semibold text-gray-900' : 'text-gray-900'
    const bgClass = level === 'primary' ? 'bg-gray-50/80 font-medium text-gray-900' : ''

    return (
      <tr className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${bgClass}`}>
        <td className={`py-1 pr-4 ${indentMap[level]}`}>
          {label}
        </td>
        <td className={`py-1 pl-4 pr-4 text-right ${valueClass}`}>
          {formatValue(value)}
        </td>
      </tr>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Ringkasan Penghasilan</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="py-1 pl-4 pr-4">Kategori</th>
              <th className="py-1 pl-4 pr-4 text-right">Rp</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. Total Pendapatan */}
            {renderRow('1. Total Pendapatan', summary.totalRevenue, 'primary', true)}

            {/* Subtotal Pesanan */}
            {renderRow('Subtotal Pesanan', summary.subtotalOrders.total, 'secondary')}
            {renderRow('Harga Asli Produk', summary.subtotalOrders.productPrice, 'tertiary')}
            {renderRow('Pengembalian Dana ke Pembeli', summary.subtotalOrders.refundToBuyer, 'tertiary')}

            {/* Voucher & Subsidi */}
            {renderRow('Voucher & Subsidi', summary.voucherSubsidy.total, 'secondary')}
            {renderRow('Voucher disponsor oleh Penjual', summary.voucherSubsidy.sellerVoucher, 'tertiary')}
            {renderRow('Cashback Koin disponsori Penjual', summary.voucherSubsidy.sellerCashbackCoin, 'tertiary')}
            {renderRow('Diskon Produk dari Platform', summary.voucherSubsidy.platformDiscount, 'tertiary')}
            {renderRow('Voucher co-fund disponsor oleh Penjual', summary.voucherSubsidy.cofundVoucherSeller, 'tertiary')}
            {renderRow('Cashback Koin Co-fund disponsori Penjual', summary.voucherSubsidy.cofundCashbackCoin, 'tertiary')}
            {renderRow('Voucher Platform', summary.voucherSubsidy.platformVoucher, 'tertiary')}

            {/* 2. Total Pengeluaran */}
            {renderRow('2. Total Pengeluaran', summary.totalExpenses, 'primary', true)}

            {/* Biaya Pengiriman */}
            {renderRow('Total Biaya Pengiriman', summary.shippingCosts.total, 'secondary')}
            {renderRow('Ongkir Dibayar Pembeli', summary.shippingCosts.buyerShipping, 'tertiary')}
            {renderRow('Ongkir Diteruskan ke Jasa Kirim', summary.shippingCosts.toCourier, 'tertiary')}
            {renderRow('Diskon Ongkir Ditanggung Jasa Kirim', summary.shippingCosts.courierDiscount, 'tertiary')}
            {renderRow('Gratis Ongkir dari Platform', summary.shippingCosts.freePlatform, 'tertiary')}
            {renderRow('Ongkos Kirim Pengembalian Barang', summary.shippingCosts.returnShipping, 'tertiary')}
            {renderRow('Return to Seller Fee', summary.shippingCosts.returnToSellerFee, 'tertiary')}
            {renderRow('Pengembalian Biaya Kirim', summary.shippingCosts.shippingRefund, 'tertiary')}

            {/* Biaya Platform */}
            {renderRow('Biaya Platform', summary.platformFees.total, 'secondary')}
            {renderRow('Biaya Administrasi', summary.platformFees.adminFee, 'tertiary')}
            {renderRow('Biaya Proses Pesanan', summary.platformFees.processingFee, 'tertiary')}

            {/* Biaya Gratis Ongkir */}
            {renderRow('Biaya Gratis Ongkir', summary.freeShippingFees.total, 'secondary')}
            {renderRow('Gratis Ongkir XTRA - Khusus (D)', summary.freeShippingFees.specialD, 'tertiary')}
            {renderRow('Gratis Ongkir XTRA - Biasa (D)', summary.freeShippingFees.normalD, 'tertiary')}
            {renderRow('Gratis Ongkir XTRA - Biasa (E)', summary.freeShippingFees.normalE, 'tertiary')}
            {renderRow('Gratis Ongkir XTRA - Biasa (F)', summary.freeShippingFees.normalF, 'tertiary')}
            {renderRow('Gratis Ongkir XTRA - Biasa (G)', summary.freeShippingFees.normalG, 'tertiary')}
            {renderRow('Gratis Ongkir XTRA - Biasa (H)', summary.freeShippingFees.normalH, 'tertiary')}
            {renderRow('Biaya Program Bebas Ongkir (TikTok)', summary.freeShippingFees.tiktokFreeShipping, 'tertiary')}

            {/* Biaya Layanan */}
            {renderRow('Biaya Layanan', summary.serviceFees?.total ?? 0, 'secondary')}
            {renderRow('Biaya Transaksi', summary.serviceFees?.transactionFee ?? 0, 'tertiary')}
            {renderRow('Biaya Layanan Promo XTRA (Free Trial)', summary.serviceFees?.promoTrialFee ?? 0, 'tertiary')}
            {renderRow('Biaya Layanan Promo', summary.serviceFees?.promoServiceFee ?? 0, 'tertiary')}

            {/* Biaya Promosi */}
            {renderRow('Biaya Promosi', summary.promotionFees.total, 'secondary')}
            {renderRow('Biaya Kampanye', summary.promotionFees.campaignFee, 'tertiary')}
            {renderRow('Biaya Komisi Iklan', summary.promotionFees.adsCommission, 'tertiary')}
            {renderRow('Biaya Isi Saldo Otomatis', summary.promotionFees.autoTopup, 'tertiary')}

            {/* Biaya Lainnya */}
            {renderRow('Biaya Lainnya', summary.otherFees.total, 'secondary')}
            {renderRow('Premi / Asuransi', summary.otherFees.premiumFee, 'tertiary')}
            {renderRow('FBS Fee', summary.otherFees.fbsFee, 'tertiary')}
            {renderRow('Biaya Transaksi Lainnya', summary.otherFees.otherTransaction, 'tertiary')}
            {renderRow('Komisi Afiliasi (TikTok)', summary.otherFees.affiliateCommission, 'tertiary')}
            {renderRow('Biaya Layanan LIVE (TikTok)', summary.otherFees.liveServiceFee, 'tertiary')}
            {renderRow('Biaya PayLater (TikTok)', summary.otherFees.paylaterFee, 'tertiary')}
            {renderRow('Biaya Tokopedia (TikTok)', summary.otherFees.tokopediaFee, 'tertiary')}
            {renderRow('Komisi Dinamis (TikTok)', summary.otherFees.dynamicCommission, 'tertiary')}

            {/* Pajak */}
            {renderRow('Pajak', summary.tax.total, 'secondary')}
            {renderRow('PPh 22', summary.tax.pph22, 'tertiary')}

            {/* 3. Total Dilepas */}
            {renderRow('3. Total yang Dilepas', summary.totalReleased, 'primary', true)}

          </tbody>
        </table>
      </div>
    </div>
  )
}
