'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Shop } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  X,
  Palette,
  Store,
  Loader2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface ProductShopSelectModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
}

export default function ProductShopSelectModal({
  isOpen,
  product,
  onClose,
}: ProductShopSelectModalProps) {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [productTemplateShopIds, setProductTemplateShopIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!isOpen || !product) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [shopsRes, templatesRes] = await Promise.all([
          supabase.from('shops').select('*').order('name'),
          supabase
            .from('product_templates')
            .select('shop_id')
            .eq('product_id', product.id),
        ])

        if (shopsRes.data) {
          setShops(shopsRes.data)
        }
        if (templatesRes.data) {
          setProductTemplateShopIds(new Set(templatesRes.data.map((t) => t.shop_id)))
        }
      } catch (err) {
        console.error('Failed to load shops or templates:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, product])

  if (!isOpen || !product) return null

  const handleSelectShop = (shopId: string) => {
    onClose()
    router.push(`/dashboard/products/${product.id}/template?shopId=${shopId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Image Template</h2>
              <p className="text-xs text-gray-500 line-clamp-1">
                Pilih toko untuk mengedit template gambar produk: <span className="font-semibold text-gray-700">{product.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200/60 p-3.5 text-xs text-amber-800">
            💡 Setiap toko memiliki template gambar tersendiri untuk produk ini. Jika belum diedit, template default toko akan digunakan sebagai dasar awal.
          </div>

          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              <span className="mt-2 text-xs text-gray-500">Memuat daftar toko...</span>
            </div>
          ) : shops.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <Store className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">Belum ada toko</p>
              <p className="mt-1 text-xs text-gray-500">
                Silakan buat toko terlebih dahulu di menu Shops.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {shops.map((shop) => {
                const hasCustom = productTemplateShopIds.has(shop.id)

                return (
                  <button
                    key={shop.id}
                    onClick={() => handleSelectShop(shop.id)}
                    className="w-full flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-md group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 border border-gray-200/60 overflow-hidden">
                        {shop.logo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={shop.logo_url}
                            alt={shop.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Store className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 transition truncate">
                            {shop.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {hasCustom ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Custom Template
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              Default Toko
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition">
                      <span>Buka Editor</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
