'use client'

import { useState, useEffect } from 'react'
import { Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ShopFilterProps {
  value: string
  onChange: (shopId: string) => void
}

export function ShopFilter({ value, onChange }: ShopFilterProps) {
  const [shops, setShops] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function loadShops() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('shops').select('id, name').order('name')
        if (data) {
          setShops(data)
        }
      } catch (err) {
        console.error('Error loading shops in filter:', err)
      }
    }
    loadShops()
  }, [])

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
      <Store className="h-4 w-4 text-gray-500 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 bg-transparent py-1 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
      >
        <option value="all">Semua Toko</option>
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
    </div>
  )
}
