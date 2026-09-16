import { ReportSummary } from '@/types/orders'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'

interface SummaryCardsProps {
  summary: ReportSummary | null
  isLoading: boolean
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('Rp', '').trim()
  }

  const cards = [
    {
      title: 'Total Pendapatan',
      value: summary?.totalRevenue || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
      isNegative: false,
    },
    {
      title: 'Total Pengeluaran',
      value: summary?.totalExpenses || 0,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-100',
      isNegative: true,
    },
    {
      title: 'Total Dana Dilepas',
      value: summary?.totalReleased || 0,
      icon: Wallet,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      isNegative: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                {card.isNegative && card.value < 0 ? '(' : ''}
                {formatCurrency(Math.abs(card.value))}
                {card.isNegative && card.value < 0 ? ')' : ''}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
