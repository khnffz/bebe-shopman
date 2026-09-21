'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Product, Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import ProductModal from '@/components/products/ProductModal'
import GenerateImageModal from '@/components/products/GenerateImageModal'
import ProductShopSelectModal from '@/components/products/ProductShopSelectModal'
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Search,
  ChevronDown,
  Palette,
} from 'lucide-react'

const PAGE_SIZE = 20

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBrandId, setFilterBrandId] = useState<string>('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [productForGeneration, setProductForGeneration] = useState<Product | null>(null)
  const [isShopSelectModalOpen, setIsShopSelectModalOpen] = useState(false)
  const [productForTemplate, setProductForTemplate] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch brands (once)
  useEffect(() => {
    supabase.from('brands').select('*').order('name').then(({ data }) => {
      if (data) setBrands(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = useCallback(
    async (search: string, brandId: string, currentOffset: number, append: boolean) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const { data, error } = await supabase.rpc('search_products', {
        search_term: search.trim(),
        brand_filter: brandId || null,
        page_offset: currentOffset,
        page_limit: PAGE_SIZE,
      })

      if (!error && data) {
        const total = data[0]?.total_count ?? 0
        setTotalCount(Number(total))
        setProducts((prev) => (append ? [...prev, ...data] : data))
      }

      setLoading(false)
      setLoadingMore(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Initial fetch
  useEffect(() => {
    fetchProducts('', '', 0, false)
  }, [fetchProducts])

  // Debounced search/filter
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setOffset(0)
      fetchProducts(value, filterBrandId, 0, false)
    }, 350)
  }

  const handleFilterChange = (brandId: string) => {
    setFilterBrandId(brandId)
    setOffset(0)
    fetchProducts(searchQuery, brandId, 0, false)
  }

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchProducts(searchQuery, filterBrandId, newOffset, true)
  }

  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setIsProductModalOpen(true)
  }

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod)
    setIsProductModalOpen(true)
  }

  const handleOpenGenerateModal = (prod: Product) => {
    setProductForGeneration(prod)
    setIsGenerateModalOpen(true)
  }

  const handleOpenEditImageModal = (prod: Product) => {
    setProductForTemplate(prod)
    setIsShopSelectModalOpen(true)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeletingId(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setTotalCount((c) => c - 1)
    } else {
      alert('Failed to delete product: ' + error.message)
    }
    setDeletingId(null)
  }

  const getBrandById = (brandId: string) => brands.find((b) => b.id === brandId) || null

  const hasMore = products.length < totalCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount > 0 ? `${totalCount} produk ditemukan` : 'Manage your master product catalog and generate multi-channel ecommerce images.'}
          </p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="product-search"
            type="text"
            placeholder="Cari produk... (mendukung multi-kata & typo)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Brand Filter */}
        <div className="relative sm:w-52">
          <select
            id="brand-filter"
            value={filterBrandId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Semua Brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, n) => (
            <div key={n} className="h-80 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {searchQuery || filterBrandId ? 'Produk tidak ditemukan' : 'No products in catalog yet'}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {searchQuery || filterBrandId
              ? 'Coba kata kunci lain atau hapus filter.'
              : 'Add your raw product photos and descriptions to start creating aesthetic ecommerce visual assets.'}
          </p>
          {!searchQuery && !filterBrandId && (
            <button
              onClick={handleCreateProduct}
              className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((prod) => {
              const brand = getBrandById(prod.brand_id)
              return (
                <div
                  key={prod.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Product Image View (Generated prioritized, fallback to Raw) */}
                  <div className="relative flex h-52 w-full items-center justify-center bg-gray-50/90 p-4">
                    {prod.generated_image_url || prod.raw_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={prod.generated_image_url || prod.raw_image_url!}
                        alt={prod.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                        <span className="mt-1 text-xs">No Image</span>
                      </div>
                    )}

                    {/* Generated Badge */}
                    {prod.generated_image_url && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-indigo-600/90 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}

                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 p-4 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenGenerateModal(prod)}
                        className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-700"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Generate Images
                      </button>
                      <button
                        onClick={() => handleOpenEditImageModal(prod)}
                        className="flex w-full items-center justify-center rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow transition hover:bg-white hover:text-indigo-600"
                      >
                        <Palette className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Edit Image
                      </button>
                      <div className="flex w-full items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditProduct(prod)}
                          className="flex flex-1 items-center justify-center rounded-xl bg-white/90 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur-sm transition hover:bg-white hover:text-indigo-600"
                          title="Edit Product"
                        >
                          <Edit2 className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          disabled={deletingId === prod.id}
                          className="flex flex-1 items-center justify-center rounded-xl bg-white/90 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur-sm transition hover:bg-white hover:text-red-600"
                          title="Delete Product"
                        >
                          {deletingId === prod.id ? (
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

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col justify-between border-t border-gray-100 p-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{prod.name}</h3>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {prod.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2 text-[11px] text-gray-400">
                      <span>{new Date(prod.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditImageModal(prod)}
                          className="font-medium text-gray-600 hover:text-indigo-600 flex items-center"
                          title="Edit Image Template"
                        >
                          <Palette className="mr-1 h-3 w-3" /> Edit Image
                        </button>
                        <button
                          onClick={() => handleOpenGenerateModal(prod)}
                          className="font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                        >
                          <Sparkles className="mr-1 h-3 w-3" /> Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex items-center justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loadingMore ? 'Memuat...' : `Tampilkan lebih banyak (${totalCount - products.length} tersisa)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        product={selectedProduct}
        brands={brands}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={() => {
          setOffset(0)
          fetchProducts(searchQuery, filterBrandId, 0, false)
        }}
      />

      <GenerateImageModal
        isOpen={isGenerateModalOpen}
        product={productForGeneration}
        brand={productForGeneration ? getBrandById(productForGeneration.brand_id) : null}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={() => {
          fetchProducts(searchQuery, filterBrandId, 0, false)
        }}
      />

      <ProductShopSelectModal
        isOpen={isShopSelectModalOpen}
        product={productForTemplate}
        onClose={() => setIsShopSelectModalOpen(false)}
      />
    </div>
  )
}
