import { Metadata } from 'next'
import { ReportUploader } from '@/components/reports/ReportUploader'
import { ImportHistory } from '@/components/reports/ImportHistory'
import { ResetDataButton } from '@/components/reports/ResetDataButton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Upload Laporan | BebeShopman',
  description: 'Upload laporan penjualan dari Shopee atau TikTok',
}

export default function UploadReportPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/reports"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Import Laporan
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload file laporan penjualan dari Seller Center dalam format Excel (.xlsx).
            </p>
          </div>
        </div>
        <div>
          <ResetDataButton />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ReportUploader 
            title="Upload Informasi & Proses Pesanan"
            endpoint="/api/sync/orders" 
          />
        </div>
        
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Riwayat Import</h3>
          <ImportHistory />
        </div>
      </div>
    </div>
  )
}
