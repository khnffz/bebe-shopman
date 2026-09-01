'use client'

import { useState, useEffect } from 'react'
import { Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import BrandModal from '@/components/brands/BrandModal'
import { Plus, Edit2, Trash2, Tag, Loader2, Image as ImageIcon, Search } from 'lucide-react'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  const fetchBrands = async (query = '') => {
    setLoading(true)
    let queryBuilder = supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    if (query.trim() !== '') {
      queryBuilder = queryBuilder.ilike('name', `%${query.trim()}%`)
    }

    const { data, error } = await queryBuilder

    if (!error && data) {
      setBrands(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBrands(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleCreate = () => {
    setSelectedBrand(null)
    setIsModalOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand? Products linked to this brand may also be affected.')) {
      return
    }

    setDeletingId(id)
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (!error) {
      setBrands((prev) => prev.filter((b) => b.id !== id))
    } else {
      alert('Failed to delete brand: ' + error.message)
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your brand identities and logos for product visual generation.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, n) => (
            <div
              key={n}
              className="h-32 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      ) : brands.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
            <Tag className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No brands found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Get started by adding your first brand logo to use in your template designs.
          </p>
          <button
            onClick={handleCreate}
            className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Brand
          </button>
        </div>
      ) : (
        /* Image Gallery Grid */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Logo Visual Area */}
              <div className="relative flex h-32 w-full items-center justify-center bg-gray-50/80 p-4">
                {brand.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                    <span className="mt-1 text-xs">No Logo</span>
                  </div>
                )}

                {/* Hover Action Buttons Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="rounded-xl bg-white/90 p-2.5 text-gray-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-indigo-600"
                    title="Edit Brand"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    disabled={deletingId === brand.id}
                    className="rounded-xl bg-white/90 p-2.5 text-gray-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:text-red-600"
                    title="Delete Brand"
                  >
                    {deletingId === brand.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Brand Info */}
              <div className="flex flex-col items-center justify-center border-t border-gray-100 p-3 text-center">
                <h3 className="w-full truncate text-sm font-semibold text-gray-900" title={brand.name}>
                  {brand.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <BrandModal
        isOpen={isModalOpen}
        brand={selectedBrand}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchBrands(searchQuery)}
      />
    </div>
  )
}
