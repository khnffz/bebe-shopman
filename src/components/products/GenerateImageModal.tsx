'use client'

import { useState, useEffect } from 'react'
import { Product, Shop, Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { X, Sparkles, Store, CheckSquare, Square, Loader2, Info } from 'lucide-react'

interface GenerateImageModalProps {
  isOpen: boolean
  product: Product | null
  brand: Brand | null
  onClose: () => void
}

export default function GenerateImageModal({
  isOpen,
  product,
  brand,
  onClose,
}: GenerateImageModalProps) {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
  const [loadingShops, setLoadingShops] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) return

    const fetchShops = async () => {
      setLoadingShops(true)
      const { data } = await supabase.from('shops').select('*').order('name')
      if (data) {
        setShops(data)
        // Select all by default
        setSelectedShopIds(data.map((s) => s.id))
      }
      setLoadingShops(false)
    }

    fetchShops()
    setStatusMessage(null)
    setIsProcessing(false)
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
      alert('Please select at least one shop target.')
      return
    }

    setIsProcessing(true)
    setStatusMessage('Pipeline ready! (Will be executed via Phase 5 engine)')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Product Images
              </h3>
              <p className="text-xs text-gray-500">
                Multi-channel AI image processing & template rendering
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

          {/* Shop Target Selection Checklist */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Target Shops ({selectedShopIds.length}/{shops.length})
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
                No shops registered. Please create a shop first.
              </div>
            ) : (
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
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

          {/* Expected Output Info */}
          <div className="flex items-start gap-2 rounded-xl bg-blue-50/80 p-3 text-xs text-blue-800">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>Output yang akan dihasilkan:</strong>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                <li>{selectedShopIds.length} Main Product Image (sesuai template toko terpilih).</li>
                <li>4 Support Product Images (dengan latar scene AI estetik).</li>
              </ul>
            </div>
          </div>

          {statusMessage && (
            <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-700">
              {statusMessage}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isProcessing || selectedShopIds.length === 0}
              className="flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? 'Generating...' : 'Generate Images'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
