'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImportBatch } from '@/types/orders'
import { FileSpreadsheet, CheckCircle2, XCircle, Clock } from 'lucide-react'

export function ImportHistory() {
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBatches() {
      const { data, error } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (!error && data) {
        setBatches(data as ImportBatch[])
      }
      setLoading(false)
    }

    fetchBatches()
  }, [supabase])

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100" />)}
    </div>
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
        Belum ada riwayat import laporan
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <ul className="divide-y divide-gray-200">
        {batches.map((batch) => (
          <li key={batch.id} className="p-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileSpreadsheet className="h-5 w-5 text-gray-500" />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{batch.filename}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="capitalize">{batch.platform}</span>
                  <span>•</span>
                  <span>{new Date(batch.created_at).toLocaleDateString('id-ID')}</span>
                  <span>•</span>
                  <span>{batch.total_orders} Pesanan</span>
                </div>
              </div>

              <div className="shrink-0">
                {batch.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sukses
                  </span>
                )}
                {batch.status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    <XCircle className="h-3.5 w-3.5" />
                    Gagal
                  </span>
                )}
                {batch.status === 'processing' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    Diproses
                  </span>
                )}
              </div>
            </div>
            {batch.error_message && (
              <p className="mt-2 text-xs text-red-500">Error: {batch.error_message}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
