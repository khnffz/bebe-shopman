'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface OrderSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function OrderSearchInput({
  value,
  onChange,
  placeholder = 'Cari no. pesanan / username...',
}: OrderSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const isFirstRender = useRef(true)

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Sync external value changes to local state
  useEffect(() => {
    setSearchTerm(value)
  }, [value])

  // Debounce notification back to parent ONLY when searchTerm changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(() => {
      onChangeRef.current(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleClear = () => {
    setSearchTerm('')
    onChange('')
  }

  return (
    <div className="relative flex-1 min-w-[240px] max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
