'use client'

import { useState, useEffect } from 'react'
import { Product, Shop, Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  X,
  Sparkles,
  Store,
  CheckSquare,
  Square,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { generateMainProductImage } from '@/lib/engine/generator'
import { uploadDataUrlAsset } from '@/lib/supabase/storage'

interface GenerateImageModalProps {
  isOpen: boolean
  product: Product | null
  brand: Brand | null
  onClose: () => void
  onSuccess?: () => void
}

interface GeneratedResult {
  shopId: string
  shopName: string
  shopLogoUrl: string | null
  imageUrl: string
}

export default function GenerateImageModal({
  isOpen,
  product,
  brand,
  onClose,
  onSuccess,
}: GenerateImageModalProps) {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [loadingShops, setLoadingShops] = useState(true)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progressStep, setProgressStep] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedResult[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) return

    const fetchShops = async () => {
      setLoadingShops(true)
      const { data } = await supabase.from('shops').select('*').order('name')
      if (data) {
        setShops(data)
        if (data.length > 0) {
          setSelectedShopIds([data[0].id])
        }
      }
      setLoadingShops(false)
    }

    fetchShops()
    setResults([])
    setErrorMessage(null)
    setIsProcessing(false)
    setProgressStep('')
  }, [isOpen])

  if (!isOpen || !product) return null

  const toggleShop = (id: string) => {
    setSelectedShopIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedShopIds.length === shops.length) {
      setSelectedShopIds([])
    } else {
      setSelectedShopIds(shops.map((s) => s.id))
    }
  }

  const handleStartGeneration = async () => {
    if (selectedShopIds.length === 0) {
      alert('Pilih minimal 1 toko target.')
      return
    }

    if (!product.raw_image_url) {
      setErrorMessage('Produk belum memiliki gambar (upload dulu).')
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setResults([])

    try {
      // 1. Image is already processed during product upload
      setProgressStep('Menyiapkan gambar produk...')
      const transparentImgUrl = product.raw_image_url

      // Fetch custom product templates for the selected shops
      const { data: customTemplates } = await supabase
        .from('product_templates')
        .select('shop_id, template_config')
        .eq('product_id', product.id)
        .in('shop_id', selectedShopIds)

      const customTemplateMap = new Map<string, any>()
      if (customTemplates) {
        for (const ct of customTemplates) {
          if (ct.template_config && Object.keys(ct.template_config).length > 0) {
            customTemplateMap.set(ct.shop_id, ct.template_config)
          }
        }
      }

      // 2. Generate Main Product Image for each selected shop
      const generatedList: GeneratedResult[] = []

      for (let i = 0; i < selectedShopIds.length; i++) {
        const shopId = selectedShopIds[i]
        const targetShop = shops.find((s) => s.id === shopId)
        if (!targetShop) continue

        const hasCustomTemplate = customTemplateMap.has(targetShop.id)
        const templateLabel = hasCustomTemplate ? 'template produk' : 'template toko'
        setProgressStep(`Membuat gambar utama (${templateLabel}): ${targetShop.name} (${i + 1}/${selectedShopIds.length})...`)

        const mainImageDataUrl = await generateMainProductImage({
          shop: targetShop,
          product,
          brand,
          transparentProductImageUrl: transparentImgUrl,
          templateConfig: customTemplateMap.get(targetShop.id),
        })

        setProgressStep(`Menyimpan gambar hasil generate: ${targetShop.name}...`)

        // Upload generated image to Supabase Storage
        const { url: uploadedUrl, error: uploadErr } = await uploadDataUrlAsset(
          mainImageDataUrl,
          'products',
          `generated-${product.id.slice(0, 8)}-${targetShop.id.slice(0, 8)}`
        )

        if (uploadErr) {
          console.error('Failed to upload generated asset:', uploadErr)
        }

        // Save generated image URL to product_templates table
        if (uploadedUrl) {
          const existingConfig = customTemplateMap.get(targetShop.id)
          const { error: upsertErr } = await supabase
            .from('product_templates')
            .upsert(
              {
                product_id: product.id,
                shop_id: targetShop.id,
                template_config: existingConfig || targetShop.template_config || {},
                generated_image_url: uploadedUrl,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'product_id,shop_id' }
            )

          if (upsertErr) {
            console.error('Failed to save to product_templates:', upsertErr)
          }
        }

        generatedList.push({
          shopId: targetShop.id,
          shopName: targetShop.name,
          shopLogoUrl: targetShop.logo_url,
          imageUrl: uploadedUrl || mainImageDataUrl,
        })
      }

      setResults(generatedList)
      setProgressStep('Selesai!')
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses gambar.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = (dataUrl: string, shopName: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${product.name.replace(/\s+/g, '-').toLowerCase()}-${shopName.replace(/\s+/g, '-').toLowerCase()}-main.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Gambar Utama Produk
              </h3>
              <p className="text-xs text-gray-500">
                Pembuatan gambar utama otomatis berbasis template toko & AI background remover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Target Product Summary */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
            {product.raw_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.raw_image_url}
                alt={product.name}
                className="h-14 w-14 rounded-lg object-contain bg-white border border-gray-200"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
                No Photo
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <h4 className="font-semibold text-sm text-gray-900 truncate">
                {product.name}
              </h4>
              <p className="text-xs text-gray-500">
                Brand: <span className="font-medium text-gray-700">{brand?.name || 'Unassigned'}</span>
              </p>
            </div>
          </div>

          {/* Shop Target Selection Checklist (When not finished) */}
          {results.length === 0 && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Pilih Target Toko ({selectedShopIds.length}/{shops.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {selectedShopIds.length === shops.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {loadingShops ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : shops.length === 0 ? (
                <div className="mt-2 rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                  Belum ada toko yang terdaftar. Buat toko terlebih dahulu di menu Shops.
                </div>
              ) : (
                <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                  {shops.map((shop) => {
                    const isChecked = selectedShopIds.includes(shop.id)
                    return (
                      <div
                        key={shop.id}
                        onClick={() => toggleShop(shop.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                          isChecked
                            ? 'border-indigo-300 bg-indigo-50/40 text-indigo-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {shop.logo_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={shop.logo_url}
                              alt={shop.name}
                              className="h-7 w-7 rounded object-contain bg-white"
                            />
                          ) : (
                            <Store className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-xs font-medium">{shop.name}</span>
                        </div>
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50/60 p-6 text-center border border-indigo-100">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-indigo-900">{progressStep}</p>
              <p className="text-xs text-indigo-500 mt-1">Mohon tunggu, proses render kanvas sedang berjalan...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Generated Result Preview */}
          {results.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Gambar Utama Berhasil Dibuat ({results.length})
                </div>
                <button
                  type="button"
                  onClick={() => setResults([])}
                  className="text-xs text-gray-500 hover:text-indigo-600 underline"
                >
                  Generate Ulang
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((res) => (
                  <div
                    key={res.shopId}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="bg-gray-100 p-2 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={res.imageUrl}
                        alt={`Main for ${res.shopName}`}
                        className="w-full aspect-square object-contain rounded-lg bg-white shadow-inner"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {res.shopName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(res.imageUrl, res.shopName)}
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {results.length > 0 ? 'Tutup' : 'Batal'}
            </button>

            {results.length === 0 && (
              <button
                type="button"
                onClick={handleStartGeneration}
                disabled={isProcessing || selectedShopIds.length === 0}
                className="flex items-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 transition"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? 'Memproses...' : 'Generate Gambar Utama'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
