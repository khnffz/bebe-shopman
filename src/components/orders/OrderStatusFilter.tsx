'use client'

import React from 'react'

interface OrderStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

const STATUS_OPTIONS = [
  'Selesai',
  'Dikirim',
  'Dibatalkan',
  'Sedang Dikirim',
  'Belum Dibayar',
  'Menunggu Pick Up',
  'Selesai Diproses'
]

export function OrderStatusFilter({ value, onChange }: OrderStatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="orderStatusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Status Pesanan:
      </label>
      <div className="relative">
        <select
          id="orderStatusFilter"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-8 py-2 shadow-sm transition-colors cursor-pointer"
        >
          <option value="all">Semua Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  )
}
