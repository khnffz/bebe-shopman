'use client'

import { useState, useEffect, useRef } from 'react'
import { Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { uploadAsset } from '@/lib/supabase/storage'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'

interface BrandModalProps {
  isOpen: boolean
  brand?: Brand | null
  onClose: () => void
  onSuccess: () => void
}

export default function BrandModal({
  isOpen,
  brand,
  onClose,
  onSuccess,
}: BrandModalProps) {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (brand) {
      setName(brand.name)
      setLogoUrl(brand.logo_url)
      setPreviewUrl(brand.logo_url)
    } else {
      setName('')
      setLogoUrl(null)
      setPreviewUrl(null)
    }
    setFile(null)
    setError(null)
  }, [brand, isOpen])

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
      setError('Brand name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to perform this action')
      }

      let finalLogoUrl = logoUrl

      // If a new file was chosen, upload it
      if (file) {
        const { url, error: uploadErr } = await uploadAsset(file, 'brands')
        if (uploadErr || !url) {
          throw new Error(uploadErr || 'Failed to upload logo')
        }
        finalLogoUrl = url
      }

      if (brand) {
        // Update existing brand
        const { error: updateErr } = await supabase
          .from('brands')
          .update({
            name: name.trim(),
            logo_url: finalLogoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', brand.id)

        if (updateErr) throw updateErr
      } else {
        // Insert new brand
        const { error: insertErr } = await supabase.from('brands').insert({
          user_id: user.id,
          name: name.trim(),
          logo_url: finalLogoUrl,
        })

        if (insertErr) throw insertErr
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {brand ? 'Edit Brand' : 'Add New Brand'}
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
              Brand Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nike, Apple, Bebe"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Brand Logo
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
                    alt="Logo Preview"
                    className="h-24 w-24 rounded-lg object-contain"
                  />
                  <span className="mt-2 text-xs font-medium text-indigo-600">
                    Click to change image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700">
                    Upload logo
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, or WEBP up to 5MB
                  </span>
                </div>
              )}
            </div>
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
              {brand ? 'Save Changes' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
