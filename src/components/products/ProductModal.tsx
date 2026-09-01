'use client'

import { useState, useEffect, useRef } from 'react'
import { Product, Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { uploadAsset } from '@/lib/supabase/storage'
import { processProductImageOffline } from '@/lib/engine/generator'
import { X, Upload, Loader2 } from 'lucide-react'

interface ProductModalProps {
  isOpen: boolean
  product?: Product | null
  brands: Brand[]
  onClose: () => void
  onSuccess: () => void
}

export default function ProductModal({
  isOpen,
  product,
  brands,
  onClose,
  onSuccess,
}: ProductModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [brandId, setBrandId] = useState('')
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeBackground, setRemoveBackground] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (product) {
      setName(product.name)
      setDescription(product.description || '')
      setBrandId(product.brand_id)
      setRawImageUrl(product.raw_image_url)
      setPreviewUrl(product.raw_image_url)
    } else {
      setName('')
      setDescription('')
      setBrandId(brands.length > 0 ? brands[0].id : '')
      setRawImageUrl(null)
      setPreviewUrl(null)
    }
    setFile(null)
    setRemoveBackground(true)
    setError(null)
  }, [product, isOpen, brands])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG or JPG)')
        return
      }
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product title is required')
      return
    }
    if (!brandId) {
      setError('Please select a brand')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let finalImageUrl = rawImageUrl

      if (file && previewUrl) {
        if (removeBackground) {
          setLoadingText('Memproses gambar (hapus background)...')
          const processedBlob = await processProductImageOffline(previewUrl)
          const processedFile = new File([processedBlob], `processed-${file.name}.png`, { type: 'image/png' })

          setLoadingText('Mengunggah gambar hasil proses...')
          const { url, error: uploadErr } = await uploadAsset(processedFile, 'products')
          if (uploadErr || !url) {
            throw new Error(uploadErr || 'Failed to upload processed product image')
          }
          finalImageUrl = url
        } else {
          setLoadingText('Mengunggah gambar original...')
          const { url, error: uploadErr } = await uploadAsset(file, 'products')
          if (uploadErr || !url) {
            throw new Error(uploadErr || 'Failed to upload original product image')
          }
          finalImageUrl = url
        }
      }

      if (product) {
        // Update product
        const { error: updateErr } = await supabase
          .from('products')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            brand_id: brandId,
            raw_image_url: finalImageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)

        if (updateErr) throw updateErr
      } else {
        // Insert product
        const { error: insertErr } = await supabase.from('products').insert({
          brand_id: brandId,
          name: name.trim(),
          description: description.trim() || null,
          raw_image_url: finalImageUrl,
        })

        if (insertErr) throw insertErr
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Brand
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              {brands.length === 0 ? (
                <option value="">No brands available (create one first)</option>
              ) : (
                brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ergonomic Office Chair Pro"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Features, material details, or key selling points..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Image
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-indigo-500 hover:bg-indigo-50/20"
            >
              {previewUrl ? (
                <div className="relative flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Product Preview"
                    className="h-32 w-32 rounded-lg object-contain"
                  />
                  <span className="mt-2 text-xs font-medium text-indigo-600">
                    Click to replace raw photo
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700">
                    Upload product photo
                  </span>
                  <span className="text-xs text-gray-500">
                    JPG or PNG with standard background
                  </span>
                </div>
              )}
            </div>

            {/* Toggle for Background Removal */}
            {file && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900">
                    Hapus Background (AI)
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Nonaktifkan jika Anda ingin mengunggah gambar aslinya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveBackground(!removeBackground)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    removeBackground ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span className="sr-only">Toggle background removal</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      removeBackground ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading && loadingText ? loadingText : (product ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
