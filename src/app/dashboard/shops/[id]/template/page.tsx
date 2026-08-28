'use client'

import { useEffect, useState, use } from 'react'
import { Shop } from '@/types'
import { createClient } from '@/lib/supabase/client'
import TemplateCanvas from '@/components/template-builder/TemplateCanvas'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ShopTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error || !data) {
        setError(error?.message || 'Shop not found')
      } else {
        setShop(data)
      }
      setLoading(false)
    }

    fetchShop()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="mt-3 text-sm text-gray-500">Loading template builder...</span>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Shop Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">{error || 'Could not load shop details.'}</p>
        <Link
          href="/dashboard/shops"
          className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shops
        </Link>
      </div>
    )
  }

  return <TemplateCanvas shop={shop} />
}
