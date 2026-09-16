'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart } from 'lucide-react'
import { OrderDetailRow } from './OrderDetailRow'

export interface OrderItemSummary {
  id: string
  order_number: string
  platform: 'shopee' | 'tiktok'
  order_date: string
  buyer_username: string | null
  product_price: number
  total_income: number
  shop_id: string | null
  shop_name: string | null
  order_status: string | null
  sync_status_finance: boolean
  sync_status_orders: boolean
}

interface OrdersTableProps {
  orders: OrderItemSummary[]
  loading: boolean
  sort: string
  dir: 'asc' | 'desc'
  onSortChange: (sort: string, dir: 'asc' | 'desc') => void
  onOrderDeleted?: () => void
}

function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return 'Rp 0'
  const num = Number(val)
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(num))
  return num < 0 ? `(${formatted})` : formatted
}

export function OrdersTable({
  orders,
  loading,
  sort,
  dir,
  onSortChange,
  onOrderDeleted,
}: OrdersTableProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id))
  }

  const handleHeaderClick = (colKey: string) => {
    if (sort === colKey) {
      onSortChange(colKey, dir === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(colKey, 'desc')
    }
  }

  const renderSortIcon = (colKey: string) => {
    if (sort !== colKey) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    return dir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
          <tr>
            <th className="w-10 px-3 py-3 font-semibold text-center"></th>
            <th
              onClick={() => handleHeaderClick('order_number')}
              className="px-4 py-3 font-semibold cursor-pointer select-none group"
            >
              <div className="flex items-center gap-1.5">
                <span>No. Pesanan</span>
                {renderSortIcon('order_number')}
              </div>
            </th>
            <th className="px-4 py-3 font-semibold">Platform & Toko</th>
            <th
              onClick={() => handleHeaderClick('order_date')}
              className="px-4 py-3 font-semibold cursor-pointer select-none group"
            >
              <div className="flex items-center gap-1.5">
                <span>Tanggal</span>
                {renderSortIcon('order_date')}
              </div>
            </th>
            <th className="px-4 py-3 font-semibold">Pembeli</th>
            <th className="px-4 py-3 font-semibold">Status Pesanan</th>
            <th className="px-4 py-3 font-semibold text-center">Status Data</th>
            <th
              onClick={() => handleHeaderClick('product_price')}
              className="px-4 py-3 font-semibold text-right cursor-pointer select-none group"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Harga Produk</span>
                {renderSortIcon('product_price')}
              </div>
            </th>
            <th
              onClick={() => handleHeaderClick('total_income')}
              className="px-4 py-3 font-semibold text-right cursor-pointer select-none group"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Total Income</span>
                {renderSortIcon('total_income')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-3 py-4 text-center">
                  <div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="h-4 w-24 bg-gray-200 rounded ml-auto"></div>
                </td>
              </tr>
            ))
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <ShoppingCart className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                  <p className="font-medium text-gray-700">Tidak ada pesanan ditemukan</p>
                  <p className="text-xs text-gray-400">
                    Coba ubah kata kunci pencarian atau sesuaikan filter platform/toko/tanggal.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const isExpanded = expandedOrderId === order.id
              const isShopee = order.platform === 'shopee'

              return (
                <React.Fragment key={order.id}>
                  <tr
                    onClick={() => toggleExpand(order.id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${isExpanded ? 'bg-indigo-50/40' : ''
                      }`}
                  >
                    <td className="px-3 py-3.5 text-center text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-600 mx-auto" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-indigo-900 text-xs sm:text-sm">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${isShopee
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                            }`}
                        >
                          {isShopee ? 'Shopee' : 'TikTok'}
                        </span>
                        {order.shop_name && (
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                            {order.shop_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                      {order.order_date}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 text-xs sm:text-sm max-w-[150px] truncate" title={order.buyer_username || '-'}>
                      {order.buyer_username || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      {order.order_status ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {order.order_status}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${order.sync_status_orders ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`} title="Data Proses & Info">𝒊</span>
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${order.sync_status_finance ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`} title="Data Keuangan">Rp</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-gray-700 text-xs sm:text-sm">
                      {formatCurrency(order.product_price)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 text-xs sm:text-sm">
                      {formatCurrency(order.total_income)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <OrderDetailRow
                      orderId={order.id}
                      onDeleteSuccess={() => {
                        setExpandedOrderId(null)
                        onOrderDeleted?.()
                      }}
                    />
                  )}
                </React.Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
