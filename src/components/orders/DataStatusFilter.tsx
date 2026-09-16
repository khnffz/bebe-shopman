'use client'

import React from 'react'

interface DataStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function DataStatusFilter({ value, onChange }: DataStatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="dataStatusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Status Data:
      </label>
      <div className="relative">
        <select
          id="dataStatusFilter"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-8 py-2 shadow-sm transition-colors cursor-pointer"
        >
          <option value="all">Semua Data</option>
          <option value="rp">Hanya Keuangan (Rp)</option>
          <option value="i">Hanya Info (𝒊)</option>
          <option value="both">Keduanya Lengkap (Rp & 𝒊)</option>
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
