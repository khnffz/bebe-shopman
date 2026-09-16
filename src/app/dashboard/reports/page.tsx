'use client'

import { useState, useEffect } from 'react'
import { SummaryCards } from '@/components/reports/SummaryCards'
import { ReportSummaryTable } from '@/components/reports/ReportSummaryTable'
import { PlatformFilter } from '@/components/reports/PlatformFilter'
import { ShopFilter } from '@/components/reports/ShopFilter'
import { PeriodSelector } from '@/components/reports/PeriodSelector'
import { PlatformComparison } from '@/components/reports/PlatformComparison'
import { ReportSummary } from '@/types/orders'
import { Download, Upload } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const [platform, setPlatform] = useState('all')
  const [shopId, setShopId] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [shopeeSummary, setShopeeSummary] = useState<ReportSummary | null>(null)
  const [tiktokSummary, setTiktokSummary] = useState<ReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams()
        
        if (platform !== 'all') queryParams.set('platform', platform)
        if (shopId !== 'all') queryParams.set('shop_id', shopId)
        if (from) queryParams.set('from', from)
        if (to) queryParams.set('to', to)
        
        const res = await fetch(`/api/reports/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary)
        }

        // If 'all' is selected, also fetch individual for comparison
        if (platform === 'all') {
          const pShopee = new URLSearchParams(queryParams)
          pShopee.set('platform', 'shopee')
          const resShopee = await fetch(`/api/reports/summary?${pShopee.toString()}`)
          if (resShopee.ok) {
            const dataS = await resShopee.json()
            setShopeeSummary(dataS.summary)
          }
          
          const pTiktok = new URLSearchParams(queryParams)
          pTiktok.set('platform', 'tiktok')
          const resTiktok = await fetch(`/api/reports/summary?${pTiktok.toString()}`)
          if (resTiktok.ok) {
            const dataT = await resTiktok.json()
            setTiktokSummary(dataT.summary)
          }
        } else if (platform === 'shopee') {
          setShopeeSummary(summary)
          setTiktokSummary(null)
        } else if (platform === 'tiktok') {
          setTiktokSummary(summary)
          setShopeeSummary(null)
        }
      } catch (error) {
        console.error('Error fetching summary', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()
  }, [platform, shopId, from, to])

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Laporan Penghasilan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan pendapatan, pengeluaran, dan dana dilepas dari semua platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reports/upload"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Link>
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <PlatformFilter value={platform} onChange={setPlatform} />
          <ShopFilter value={shopId} onChange={setShopId} />
        </div>
        <PeriodSelector from={from} to={to} onChange={(f, t) => {
          setFrom(f)
          setTo(t)
        }} />
      </div>

      <div className="mb-8">
        <SummaryCards summary={summary} isLoading={isLoading} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReportSummaryTable summary={summary} isLoading={isLoading} />
        </div>
        <div>
          {platform === 'all' && (
            <PlatformComparison 
              shopeeSummary={shopeeSummary}
              tiktokSummary={tiktokSummary}
              isLoading={isLoading} 
            />
          )}
        </div>
      </div>
    </div>
  )
}
