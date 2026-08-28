'use client'

import { useState, useEffect } from 'react'
import { Shop } from '@/types'
import { createClient } from '@/lib/supabase/client'
import ShopModal from '@/components/shops/ShopModal'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Store, Sliders, Loader2, Image as ImageIcon } from 'lucide-react'

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchShops = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setShops(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchShops()
  }, [])

  const handleCreate = () => {
    setSelectedShop(null)
    setIsModalOpen(true)
  }

  const handleEdit = (shop: Shop) => {
    setSelectedShop(shop)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shop and its saved template?')) {
      return
    }

    setDeletingId(id)
    const { error } = await supabase.from('shops').delete().eq('id', id)
    if (!error) {
      setShops((prev) => prev.filter((s) => s.id !== id))
    } else {
      alert('Failed to delete shop: ' + error.message)
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage ecommerce channels, logos, and custom visual template layouts.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Shop
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      ) : shops.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
            <Store className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No shops registered yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Add your ecommerce shops (e.g. Tokopedia, Shopee, TikTok Shop) to customize dedicated visual templates.
          </p>
          <button
            onClick={handleCreate}
            className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Shop
          </button>
        </div>
      ) : (
        /* Image Gallery Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Logo Visual Area */}
              <div className="relative flex h-48 w-full items-center justify-center bg-gray-50/80 p-6">
                {shop.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                    <span className="mt-1 text-xs">No Shop Logo</span>
                  </div>
                )}

                {/* Hover Action Buttons Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 p-4 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                  <Link
                    href={`/dashboard/shops/${shop.id}/template`}
                    className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-700"
                  >
                    <Sliders className="mr-1.5 h-3.5 w-3.5" />
                    Template Settings
                  </Link>
                  <div className="flex w-full items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(shop)}
                      className="flex flex-1 items-center justify-center rounded-xl bg-white/90 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur-sm transition hover:bg-white hover:text-indigo-600"
                      title="Edit Shop"
                    >
                      <Edit2 className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shop.id)}
                      disabled={deletingId === shop.id}
                      className="flex flex-1 items-center justify-center rounded-xl bg-white/90 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur-sm transition hover:bg-white hover:text-red-600"
                      title="Delete Shop"
                    >
                      {deletingId === shop.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Shop Info */}
              <div className="flex items-center justify-between border-t border-gray-100 p-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                  <span className="text-xs text-gray-400">
                    Added {new Date(shop.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ShopModal
        isOpen={isModalOpen}
        shop={selectedShop}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchShops}
      />
    </div>
  )
}
