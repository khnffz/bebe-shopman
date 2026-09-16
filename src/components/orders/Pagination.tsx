'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null

  const from = Math.min((currentPage - 1) * limit + 1, totalItems)
  const to = Math.min(currentPage * limit, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-2xl text-sm">
      <div className="text-gray-500">
        Menampilkan <span className="font-semibold text-gray-900">{from}</span> -{' '}
        <span className="font-semibold text-gray-900">{to}</span> dari{' '}
        <span className="font-semibold text-gray-900">{totalItems}</span> pesanan
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 mr-2">
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Selanjutnya
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
