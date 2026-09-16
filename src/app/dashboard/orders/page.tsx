'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'
import { PlatformFilter } from '@/components/reports/PlatformFilter'
import { ShopFilter } from '@/components/reports/ShopFilter'
import { PeriodSelector } from '@/components/reports/PeriodSelector'
import { OrderSearchInput } from '@/components/orders/OrderSearchInput'
import { OrdersTable, OrderItemSummary } from '@/components/orders/OrdersTable'
import { Pagination } from '@/components/orders/Pagination'
import { DataStatusFilter } from '@/components/orders/DataStatusFilter'
import { OrderStatusFilter } from '@/components/orders/OrderStatusFilter'

export default function OrdersPage() {
  const [platform, setPlatform] = useState<string>('all')
  const [shopId, setShopId] = useState<string>('all')
  const [dataStatus, setDataStatus] = useState<string>('all')
  const [orderStatus, setOrderStatus] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [sort, setSort] = useState<string>('order_date')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState<number>(1)
  const limit = 20

  const [orders, setOrders] = useState<OrderItemSummary[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      params.set('platform', platform)
      params.set('shop_id', shopId)
      if (dataStatus !== 'all') params.set('data_status', dataStatus)
      if (orderStatus !== 'all') params.set('order_status', orderStatus)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      if (search) params.set('search', search)
      params.set('sort', sort)
      params.set('dir', dir)

      const res = await fetch(`/api/orders?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal mengambil data pesanan')

      const data = await res.json()
      setOrders(data.orders || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, platform, shopId, dataStatus, orderStatus, fromDate, toDate, search, sort, dir])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Reset page to 1 when filters or search change
  const handlePlatformChange = useCallback((val: string) => {
    setPlatform(val)
    setPage(1)
  }, [])

  const handleShopChange = useCallback((val: string) => {
    setShopId(val)
    setPage(1)
  }, [])

  const handleDataStatusChange = useCallback((val: string) => {
    setDataStatus(val)
    setPage(1)
  }, [])

  const handleOrderStatusChange = useCallback((val: string) => {
    setOrderStatus(val)
    setPage(1)
  }, [])

  const handlePeriodChange = useCallback((f: string, t: string) => {
    setFromDate(f)
    setToDate(t)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((newSort: string, newDir: 'asc' | 'desc') => {
    setSort(newSort)
    setDir(newDir)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Pesanan</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Lihat, filter, dan cari seluruh pesanan yang telah diimpor dari Shopee dan TikTok Shop.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Controls & Filters Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar */}
          <OrderSearchInput value={search} onChange={handleSearchChange} />

          {/* Platform Filter */}
          <PlatformFilter value={platform} onChange={handlePlatformChange} />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <ShopFilter value={shopId} onChange={handleShopChange} />
          <DataStatusFilter value={dataStatus} onChange={handleDataStatusChange} />
          <OrderStatusFilter value={orderStatus} onChange={handleOrderStatusChange} />
          <PeriodSelector from={fromDate} to={toDate} onChange={handlePeriodChange} />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <OrdersTable
          orders={orders}
          loading={loading}
          sort={sort}
          dir={dir}
          onSortChange={handleSortChange}
          onOrderDeleted={fetchOrders}
        />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  )
}
