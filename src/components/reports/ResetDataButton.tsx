'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ResetDataButton() {
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    if (!window.confirm('Yakin ingin mereset/menghapus semua data laporan (orders, order_items, riwayat)? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    setIsResetting(true)
    try {
      const res = await fetch('/api/reports/reset', { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset data')
      }
      
      alert('Semua data laporan berhasil direset!')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={isResetting}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50"
    >
      {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {isResetting ? 'Mereset Data...' : 'Reset Semua Data'}
    </button>
  )
}
