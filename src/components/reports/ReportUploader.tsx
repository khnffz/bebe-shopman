'use client'

import { useState, useEffect } from 'react'
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ReportUploader({
  endpoint = '/api/reports/upload',
  title = 'Upload Laporan Penjualan',
}: {
  endpoint?: string
  title?: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [shops, setShops] = useState<{ id: string; name: string }[]>([])
  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const [overwrite, setOverwrite] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [result, setResult] = useState<{ success?: boolean; error?: string; data?: any } | null>(null)

  useEffect(() => {
    async function loadShops() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('shops').select('id, name').order('name')
        if (data && data.length > 0) {
          setShops(data)
          setSelectedShopId(data[0].id)
        }
      } catch (err) {
        console.error('Error loading shops:', err)
      }
    }
    loadShops()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setProgress(0)
      setStatusMessage('')
    }
  }

  const handleUpload = () => {
    if (!file) return

    setIsUploading(true)
    setProgress(0)
    setStatusMessage('Mengunggah file...')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    if (selectedShopId) {
      formData.append('shop_id', selectedShopId)
    }
    if (overwrite) {
      formData.append('overwrite', 'true')
    }

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setProgress(percent)
        if (percent < 100) {
          setStatusMessage(`Mengunggah file... ${percent}%`)
        } else {
          setStatusMessage('File terunggah. Membaca sheet & menyimpan data...')
        }
      }
    })

    xhr.addEventListener('load', () => {
      setIsUploading(false)
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100)
          setStatusMessage('Selesai!')
          setResult({ success: true, data })
          setFile(null)
        } else {
          setResult({ success: false, error: data.error || 'Upload gagal diproses' })
        }
      } catch (err) {
        setResult({ success: false, error: 'Respon server tidak valid' })
      }
    })

    xhr.addEventListener('error', () => {
      setIsUploading(false)
      setResult({ success: false, error: 'Koneksi terputus saat mengunggah file' })
    })

    xhr.open('POST', endpoint)
    xhr.send(formData)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <div className="mb-5">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <Store className="h-4 w-4 text-indigo-600" />
          Pilih Toko / Shop:
        </label>
        {shops.length > 0 ? (
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            disabled={isUploading}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-100"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-3 text-xs text-gray-500">
            Belum ada data toko. Silakan tambahkan toko di menu <span className="font-semibold text-indigo-600">Shops</span> terlebih dahulu untuk mengaitkan laporan dengan toko.
          </div>
        )}
      </div>

      {/* Overwrite toggle */}
      <div className="mb-5">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-1 transition-colors hover:border-amber-300 hover:bg-amber-50/50">
          <div className="relative">
            <input
              type="checkbox"
              id="overwrite-checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={isUploading}
              className="sr-only"
            />
            <div className={`h-5 w-5 rounded border-2 transition-colors flex items-center justify-center ${overwrite ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'
              }`}>
              {overwrite && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Timpa data lama</p>
            <p className="text-xs text-gray-500">Pesanan yang sudah ada akan dihapus lalu diganti dengan data baru dari file ini</p>
          </div>
        </label>
      </div>

      <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />

        <UploadCloud className="mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-1 text-sm font-medium text-gray-700">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">Excel files (.xlsx) only</p>
      </div>

      {file && (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-indigo-500 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Proses File'
              )}
            </button>
          </div>

          {isUploading && (
            <div className="mt-4 space-y-2 border-t border-gray-200/60 pt-3">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {statusMessage}
                </span>
                <span className="font-semibold text-indigo-700">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={`mt-4 flex items-start gap-3 rounded-lg p-4 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? (
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          )}
          <div>
            <p className="text-sm font-medium">
              {result.success ? 'Upload Berhasil!' : 'Upload Gagal'}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {result.success
                ? (result.data.message || `Berhasil mengimpor ${result.data.totalOrders} pesanan dari platform ${result.data.platform}.`)
                : result.error}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
