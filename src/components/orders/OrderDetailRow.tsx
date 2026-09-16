'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, AlertCircle, ShoppingBag, DollarSign, ChevronUp, ChevronDown, Trash2, AlertTriangle } from 'lucide-react'

interface OrderDetailRowProps {
  orderId: string
  onDeleteSuccess?: () => void
}

function formatShopeeAmount(val: number | null | undefined, isDeduction: boolean = false): string {
  if (val === null || val === undefined || isNaN(Number(val))) return 'Rp0'
  const num = Number(val)
  if (num === 0) return 'Rp0'

  const absVal = Math.abs(num)
  const formatted = new Intl.NumberFormat('id-ID').format(absVal)

  if (isDeduction || num < 0) {
    return `-Rp${formatted}`
  }
  return `Rp${formatted}`
}

export function OrderDetailRow({ orderId, onDeleteSuccess }: OrderDetailRowProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ order: any; items: any[] } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Track expanded/collapsed state for financial categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    subtotal_pesanan: true,
    subtotal_ongkir: true,
    biaya_platform: true,
    biaya_gratis_ongkir: true,
    biaya_layanan: true,
    biaya_layanan_tambahan: true,
  })

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleDeleteOrder = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menghapus pesanan')
      }

      setShowDeleteConfirm(false)
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Terjadi kesalahan saat menghapus pesanan')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat detail pesanan')
        return res.json()
      })
      .then((resData) => {
        if (isMounted) {
          setData(resData)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [orderId])

  if (loading) {
    return (
      <tr className="bg-gray-50/70">
        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Memuat detail pesanan...</span>
          </div>
        </td>
      </tr>
    )
  }

  if (error || !data) {
    return (
      <tr className="bg-red-50/50">
        <td colSpan={7} className="px-6 py-4 text-center text-red-600 text-sm">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error || 'Data tidak ditemukan'}</span>
          </div>
        </td>
      </tr>
    )
  }

  const { order, items } = data

  // Financial values calculation
  const productPrice = Number(order.product_price) || 0

  const shippingBuyer = Number(order.shipping_buyer) || 0
  const shippingCourier = Number(order.shipping_to_courier) || 0
  const shippingDiscount =
    (Number(order.shipping_discount_courier) || 0) +
    (Number(order.shipping_free_platform) || 0) +
    (Number(order.shipping_subsidy) || 0) +
    (Number(order.seller_free_shipping_promo) || 0)
  const shippingRefund = Number(order.shipping_refund) || 0
  const subtotalOngkir = shippingBuyer + shippingCourier + shippingDiscount + shippingRefund

  const adminFee = Number(order.admin_fee) || 0
  const processingFee = Number(order.processing_fee) || 0
  const totalBiayaPlatform = adminFee + processingFee

  const freeShippingD = Number(order.free_shipping_special_d) || Number(order.free_shipping_normal_d) || 0
  const freeShippingE = Number(order.free_shipping_normal_e) || 0
  const freeShippingF = Number(order.free_shipping_normal_f) || 0
  const freeShippingG = Number(order.free_shipping_normal_g) || 0
  const freeShippingH = Number(order.free_shipping_normal_h) || 0
  const totalBiayaGratisOngkir =
    Number(order.free_shipping_fee) ||
    freeShippingD + freeShippingE + freeShippingF + freeShippingG + freeShippingH

  const promoTrialFee = Number(order.service_promo_trial_fee) || 0
  const promoFee = Number(order.service_promo_fee) || 0
  const serviceTransFee = Number(order.service_transaction_fee) || 0
  const totalBiayaLayanan = promoTrialFee + promoFee + serviceTransFee

  const campaignFee = Number(order.campaign_fee) || 0
  const adsFee = Number(order.ads_commission_fee) || 0
  const autoTopupFee = Number(order.auto_topup_fee) || 0
  const otherFee = Number(order.other_transaction_fee) || 0
  const affiliateFee = Number(order.affiliate_commission) || 0
  const totalBiayaLayananTambahan = campaignFee + adsFee + autoTopupFee + otherFee + affiliateFee

  return (
    <tr className="bg-slate-50/90 border-b border-gray-200">
      <td colSpan={9} className="px-6 py-5">
        <div className="space-y-5 text-sm text-gray-700">
          {/* Top 2-Column Info & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Order Information */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between font-semibold text-gray-900 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span>Informasi Pesanan</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null)
                    setShowDeleteConfirm(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors shadow-sm"
                  title="Hapus riwayat pesanan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pesanan</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Info Umum */}
                <div>
                  <h4 className="font-semibold text-xs text-indigo-900 mb-2 uppercase tracking-wider">Info Umum</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-gray-500">Toko:</span>
                      <p className="font-medium text-gray-900">{order.shop_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Platform/Channel:</span>
                      <p className="font-medium text-gray-900">{order.order_channel || order.platform || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status Pesanan:</span>
                      <p className="font-medium text-gray-900">{order.order_status || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Substatus:</span>
                      <p className="font-medium text-gray-900">{order.order_substatus || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tanggal Pesanan:</span>
                      <p className="font-medium text-gray-900">{order.created_time || order.order_date || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tanggal Pembayaran:</span>
                      <p className="font-medium text-gray-900">{order.paid_time || order.payment_date || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Metode Pembayaran:</span>
                      <p className="font-medium text-gray-900">{order.payment_method || '-'}</p>
                    </div>
                    {order.cancel_reason && (
                      <div className="col-span-2">
                        <span className="text-red-500">Alasan Batal ({order.cancel_by || 'Sistem'}):</span>
                        <p className="font-medium text-red-700">{order.cancel_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Pengiriman */}
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="font-semibold text-xs text-indigo-900 mb-2 uppercase tracking-wider">Info Pengiriman</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-gray-500">Kurir:</span>
                      <p className="font-medium text-gray-900">{order.courier_name || order.courier_service || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">No. Resi:</span>
                      <p className="font-medium text-gray-900">{order.tracking_id || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipe Pengiriman:</span>
                      <p className="font-medium text-gray-900">{order.delivery_option || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipe Fulfillment:</span>
                      <p className="font-medium text-gray-900">{order.fulfillment_type || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Waktu Dikirim:</span>
                      <p className="font-medium text-gray-900">{order.shipped_time || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Waktu Selesai:</span>
                      <p className="font-medium text-gray-900">{order.delivered_time || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Info Pembeli */}
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="font-semibold text-xs text-indigo-900 mb-2 uppercase tracking-wider">Info Pembeli & Penerima</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div>
                        <span className="text-gray-500">Username Pembeli:</span>
                        <p className="font-medium text-gray-900">{order.buyer_username || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Nama Penerima:</span>
                        <p className="font-medium text-gray-900">{order.recipient_name || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">No. HP Penerima:</span>
                        <p className="font-medium text-gray-900">{order.recipient_phone || '-'}</p>
                      </div>
                      {order.buyer_message && (
                        <div>
                          <span className="text-gray-500">Pesan Pembeli:</span>
                          <p className="font-medium text-gray-900 italic">"{order.buyer_message}"</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Alamat Pengiriman:</span>
                      <p className="font-medium text-gray-900 leading-relaxed">
                        {order.detail_address ? (
                          <>
                            {order.detail_address}<br />
                            {order.village && `${order.village}, `}{order.district && `${order.district}, `}
                            {order.city && `${order.city}, `}{order.province && `${order.province} `}
                            {order.zipcode && order.zipcode}
                          </>
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Rincian Keuangan (Exact Shopee Format) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-semibold text-gray-900 border-b border-gray-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Rincian Keuangan</span>
              </div>

              {/* Shopee Style Financial Tree */}
              <div className="text-xs space-y-2.5">
                {/* 1. Subtotal Pesanan */}
                <div>
                  <div
                    onClick={() => toggleCategory('subtotal_pesanan')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-semibold text-gray-900">
                      Subtotal Pesanan
                    </div>
                    <div className="w-28 text-right pl-3 flex items-center justify-end gap-1 font-medium text-gray-900">
                      <span>{formatShopeeAmount(productPrice)}</span>
                      {expandedCategories.subtotal_pesanan ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedCategories.subtotal_pesanan && (
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                        Harga Produk
                      </div>
                      <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                        {formatShopeeAmount(productPrice)}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Subtotal Ongkos Kirim */}
                <div>
                  <div
                    onClick={() => toggleCategory('subtotal_ongkir')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-semibold text-gray-900">
                      Subtotal Ongkos Kirim
                    </div>
                    <div className="w-28 text-right pl-3 flex items-center justify-end gap-1 font-medium text-gray-900">
                      <span>{formatShopeeAmount(subtotalOngkir)}</span>
                      {expandedCategories.subtotal_ongkir ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedCategories.subtotal_ongkir && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                          Ongkir Dibayar Pembeli
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(shippingBuyer)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                          Ongkos Kirim yang Dibayarkan ke Jasa Kirim
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(shippingCourier, true)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                          Potongan Ongkos Kirim dari Shopee
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(shippingDiscount)}
                        </div>
                      </div>
                      {shippingRefund !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Pengembalian Biaya Kirim
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(shippingRefund)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Biaya Platform */}
                <div>
                  <div
                    onClick={() => toggleCategory('biaya_platform')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-semibold text-gray-900 inline-flex items-center justify-end gap-1">
                      <span>Biaya Platform</span>
                    </div>
                    <div className="w-28 text-right pl-3 flex items-center justify-end gap-1 font-medium text-gray-900">
                      <span>{formatShopeeAmount(totalBiayaPlatform, true)}</span>
                      {expandedCategories.biaya_platform ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedCategories.biaya_platform && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500 inline-flex items-center justify-end gap-1">
                          <span>Biaya Administrasi</span>
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(adminFee, true)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500 inline-flex items-center justify-end gap-1">
                          <span>Biaya Proses Pesanan</span>
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(processingFee, true)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Biaya Gratis Ongkir XTRA */}
                <div>
                  <div
                    onClick={() => toggleCategory('biaya_gratis_ongkir')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-semibold text-gray-900 inline-flex items-center justify-end gap-1">
                      <span>Biaya Gratis Ongkir XTRA</span>
                    </div>
                    <div className="w-28 text-right pl-3 flex items-center justify-end gap-1 font-medium text-gray-900">
                      <span>{formatShopeeAmount(totalBiayaGratisOngkir, true)}</span>
                      {expandedCategories.biaya_gratis_ongkir ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedCategories.biaya_gratis_ongkir && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                          {order.free_shipping_special_d
                            ? 'Biaya Gratis Ongkir XTRA - Ukuran Khusus (Kategori D)'
                            : 'Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori D)'}
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(freeShippingD || totalBiayaGratisOngkir, true)}
                        </div>
                      </div>
                      {freeShippingE !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori E)
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(freeShippingE, true)}
                          </div>
                        </div>
                      )}
                      {freeShippingF !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori F)
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(freeShippingF, true)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Biaya Layanan */}
                <div>
                  <div
                    onClick={() => toggleCategory('biaya_layanan')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-semibold text-gray-900 inline-flex items-center justify-end gap-1">
                      <span>Biaya Layanan</span>
                    </div>
                    <div className="w-28 text-right pl-3 flex items-center justify-end gap-1 font-medium text-gray-900">
                      <span>{formatShopeeAmount(totalBiayaLayanan, true)}</span>
                      {expandedCategories.biaya_layanan ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {expandedCategories.biaya_layanan && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                          Biaya Layanan Promo XTRA (Promo XTRA+ Free Trial)
                        </div>
                        <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                          {formatShopeeAmount(promoTrialFee || totalBiayaLayanan, true)}
                        </div>
                      </div>
                      {promoFee !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Layanan Promo XTRA
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(promoFee, true)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Subtotal Biaya Layanan Tambahan */}
                <div>
                  <div
                    onClick={() => toggleCategory('biaya_layanan_tambahan')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-semibold text-gray-900">
                      Subtotal Biaya Layanan Tambahan
                    </div>
                    <div className="w-28 text-right pl-3 flex items-center justify-end gap-1 font-medium text-gray-900">
                      <span>{formatShopeeAmount(totalBiayaLayananTambahan, true)}</span>
                      {totalBiayaLayananTambahan !== 0 && (
                        expandedCategories.biaya_layanan_tambahan ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                  {expandedCategories.biaya_layanan_tambahan && totalBiayaLayananTambahan !== 0 && (
                    <div className="mt-1 space-y-1">
                      {campaignFee !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Kampanye
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(campaignFee, true)}
                          </div>
                        </div>
                      )}
                      {adsFee !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Komisi AMS
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(adsFee, true)}
                          </div>
                        </div>
                      )}
                      {autoTopupFee !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Isi Saldo Otomatis
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(autoTopupFee, true)}
                          </div>
                        </div>
                      )}
                      {otherFee !== 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 text-gray-500">
                            Biaya Lainnya
                          </div>
                          <div className="w-28 text-right pl-3 text-gray-500 pr-4">
                            {formatShopeeAmount(otherFee, true)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 7. Total Penghasilan */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex-1 text-right pr-3 border-r border-dashed border-gray-200 font-bold text-gray-900 text-sm inline-flex items-center justify-end gap-1">
                    <span>Total Penghasilan</span>
                  </div>
                  <div className="w-28 text-right pl-3 font-bold text-lg sm:text-lg">
                    {formatShopeeAmount(order.total_income)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-900 text-xs flex items-center justify-between">
              <span>Daftar Item ({items.length})</span>
            </div>
            {items.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">Tidak ada rincian item</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-medium">Nama Produk</th>
                      <th className="px-4 py-2 font-medium">SKU Penjual</th>
                      <th className="px-4 py-2 font-medium text-center">Jumlah</th>
                      <th className="px-4 py-2 font-medium text-right">Harga Satuan / Item</th>
                      <th className="px-4 py-2 font-medium text-right">Penghasilan Item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate" title={item.product_name}>
                          {item.product_name || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 max-w-[120px] truncate" title={item.seller_sku}>
                          {item.seller_sku || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-700">{item.quantity || 1}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">
                          {formatShopeeAmount(item.item_product_price)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                          {formatShopeeAmount(item.item_total_income)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal Popup */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    Hapus Riwayat Pesanan?
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Tindakan ini akan menghapus data pesanan beserta seluruh item di dalamnya secara permanen dari database.
                  </p>
                </div>
              </div>

              {/* Detail Info Ringkas */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Pesanan:</span>
                  <span className="font-semibold text-gray-900">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform:</span>
                  <span className="font-medium text-gray-900 capitalize">{order.platform}</span>
                </div>
                {order.shop_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Toko:</span>
                    <span className="font-medium text-gray-900">{order.shop_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Item:</span>
                  <span className="font-medium text-gray-900">{items?.length || 0} item</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-gray-500">Total Pendapatan:</span>
                  <span className="font-bold text-gray-900">{formatShopeeAmount(order.total_income)}</span>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteOrder}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}
