'use client'

import { useState, useEffect } from 'react'
import { Product, Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import ProductModal from '@/components/products/ProductModal'
import GenerateImageModal from '@/components/products/GenerateImageModal'
import { Plus, Edit2, Trash2, Package, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [productForGeneration, setProductForGeneration] = useState<Product | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    const [productsRes, brandsRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('brands').select('*').order('name'),
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (brandsRes.data) setBrands(brandsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setDeletingId(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } else {
      alert('Failed to delete product: ' + error.message)
    }
    setDeletingId(null)
  }

  const getBrandById = (brandId: string) => {
    return brands.find((b) => b.id === brandId) || null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your master product catalog and generate multi-channel ecommerce images.
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

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
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
            No products in catalog yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Add your raw product photos and descriptions to start creating aesthetic ecommerce visual assets.
          </p>
          <button
            onClick={handleCreateProduct}
            className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Product
          </button>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((prod) => {
            const brand = getBrandById(prod.brand_id)
            return (
              <div
                key={prod.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Product Raw Image View */}
                <div className="relative flex h-52 w-full items-center justify-center bg-gray-50/90 p-4">
                  {prod.raw_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={prod.raw_image_url}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="h-10 w-10 stroke-[1.5]" />
                      <span className="mt-1 text-xs">No Raw Image</span>
                    </div>
                  )}

                  {/* Brand Badge */}
                  {brand && (
                    <div className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                      {brand.name}
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
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {prod.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {prod.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2 text-[11px] text-gray-400">
                    <span>{new Date(prod.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleOpenGenerateModal(prod)}
                      className="font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <Sparkles className="mr-1 h-3 w-3" /> Generate
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        product={selectedProduct}
        brands={brands}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={fetchData}
      />

      <GenerateImageModal
        isOpen={isGenerateModalOpen}
        product={productForGeneration}
        brand={productForGeneration ? getBrandById(productForGeneration.brand_id) : null}
        onClose={() => setIsGenerateModalOpen(false)}
      />
    </div>
  )
}
