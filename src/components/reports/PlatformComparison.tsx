import { ReportSummary } from '@/types/orders'

interface PlatformComparisonProps {
  shopeeSummary: ReportSummary | null
  tiktokSummary: ReportSummary | null
  isLoading: boolean
}

export function PlatformComparison({ shopeeSummary, tiktokSummary, isLoading }: PlatformComparisonProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-64 animate-pulse bg-gray-50/50" />
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value)).replace('Rp', '').trim()
    return value < 0 ? `(${formatted})` : formatted
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Perbandingan Platform</h3>
      </div>
      
      <div className="overflow-x-auto p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="pb-3 font-medium">Metrik</th>
              <th className="pb-3 text-right font-medium text-orange-600">🟠 Shopee</th>
              <th className="pb-3 text-right font-medium text-slate-800">⬛ TikTok</th>
              <th className="pb-3 text-right font-medium text-indigo-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-4 text-gray-900">Pendapatan</td>
              <td className="py-4 text-right">{formatCurrency(shopeeSummary?.totalRevenue || 0)}</td>
              <td className="py-4 text-right">{formatCurrency(tiktokSummary?.totalRevenue || 0)}</td>
              <td className="py-4 text-right font-medium text-indigo-600">
                {formatCurrency((shopeeSummary?.totalRevenue || 0) + (tiktokSummary?.totalRevenue || 0))}
              </td>
            </tr>
            <tr>
              <td className="py-4 text-gray-900">Pengeluaran</td>
              <td className="py-4 text-right text-red-600">{formatCurrency(shopeeSummary?.totalExpenses || 0)}</td>
              <td className="py-4 text-right text-red-600">{formatCurrency(tiktokSummary?.totalExpenses || 0)}</td>
              <td className="py-4 text-right font-medium text-red-600">
                {formatCurrency((shopeeSummary?.totalExpenses || 0) + (tiktokSummary?.totalExpenses || 0))}
              </td>
            </tr>
            <tr className="bg-gray-50/50">
              <td className="py-4 font-semibold text-gray-900">Total Dilepas</td>
              <td className="py-4 text-right font-semibold">{formatCurrency(shopeeSummary?.totalReleased || 0)}</td>
              <td className="py-4 text-right font-semibold">{formatCurrency(tiktokSummary?.totalReleased || 0)}</td>
              <td className="py-4 text-right font-bold text-indigo-700">
                {formatCurrency((shopeeSummary?.totalReleased || 0) + (tiktokSummary?.totalReleased || 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
