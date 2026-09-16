'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

interface PeriodSelectorProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function PeriodSelector({ from, to, onChange }: PeriodSelectorProps) {
  // Infer initial mode
  const [mode, setMode] = useState<'all' | 'monthly' | 'custom'>(() => {
    if (!from && !to) return 'all'
    return 'monthly'
  })

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()) // 0-11

  const handleModeChange = (newMode: 'all' | 'monthly' | 'custom') => {
    setMode(newMode)
    if (newMode === 'all') {
      onChange('', '')
    } else if (newMode === 'monthly') {
      applyMonth(selectedYear, selectedMonth)
    }
  }

  const applyMonth = (year: number, month: number) => {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    
    // Format YYYY-MM-DD
    const pad = (n: number) => n.toString().padStart(2, '0')
    const startStr = `${year}-${pad(month + 1)}-01`
    const endStr = `${year}-${pad(month + 1)}-${pad(end.getDate())}`
    
    onChange(startStr, endStr)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10)
    setSelectedMonth(m)
    applyMonth(selectedYear, m)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10)
    setSelectedYear(y)
    applyMonth(y, selectedMonth)
  }

  // Available years: 2024 to 2027
  const years = [2024, 2025, 2026, 2027]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Mode Buttons */}
      <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/80 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => handleModeChange('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            mode === 'all'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('monthly')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            mode === 'monthly'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Per Bulan
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('custom')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            mode === 'custom'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Custom Tanggal
        </button>
      </div>

      {/* Monthly Picker */}
      {mode === 'monthly' && (
        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1 shadow-sm">
          <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="border-0 bg-transparent py-1 pr-6 text-sm font-medium text-gray-800 focus:outline-none focus:ring-0"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="border-0 bg-transparent py-1 pr-6 text-sm font-medium text-gray-800 focus:outline-none focus:ring-0"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Date Picker */}
      {mode === 'custom' && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1 shadow-sm">
          <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
          <input
            type="date"
            value={from}
            onChange={(e) => onChange(e.target.value, to)}
            className="border-0 bg-transparent py-1 text-sm text-gray-800 focus:outline-none focus:ring-0"
          />
          <span className="text-xs text-gray-400">s/d</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange(from, e.target.value)}
            className="border-0 bg-transparent py-1 text-sm text-gray-800 focus:outline-none focus:ring-0"
          />
        </div>
      )}
    </div>
  )
}
