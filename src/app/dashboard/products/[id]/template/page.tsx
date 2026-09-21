'use client'

import { useEffect, useState, use } from 'react'
import { Shop, Product, Brand } from '@/types'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const TemplateCanvas = dynamic(
  () => import('@/components/template-builder/TemplateCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="mt-3 text-sm text-gray-500">Initializing canvas...</span>
      </div>
    ),
  }
)

export default function ProductTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const shopId = searchParams.get('shopId')

  const [product, setProduct] = useState<Product | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [initialProductTemplate, setInitialProductTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) {
        setError('Parameter shopId tidak ditemukan.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [productRes, shopRes, templateRes] = await Promise.all([
          supabase.from('products').select('*').eq('id', resolvedParams.id).single(),
          supabase.from('shops').select('*').eq('id', shopId).single(),
          supabase
            .from('product_templates')
            .select('*')
            .eq('product_id', resolvedParams.id)
            .eq('shop_id', shopId)
            .maybeSingle(),
        ])

        if (productRes.error || !productRes.data) {
          setError(productRes.error?.message || 'Produk tidak ditemukan.')
          setLoading(false)
          return
        }

        if (shopRes.error || !shopRes.data) {
          setError(shopRes.error?.message || 'Toko tidak ditemukan.')
          setLoading(false)
          return
        }

        setProduct(productRes.data)
        setShop(shopRes.data)
        if (templateRes.data?.template_config) {
          setInitialProductTemplate(templateRes.data.template_config)
        }

        // Fetch brand data using product's brand_id
        if (productRes.data.brand_id) {
          const brandRes = await supabase
            .from('brands')
            .select('*')
            .eq('id', productRes.data.brand_id)
            .single()

          if (!brandRes.error && brandRes.data) {
            setBrand(brandRes.data)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat memuat data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id, shopId])

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="mt-3 text-sm text-gray-500">Memuat editor template produk...</span>
      </div>
    )
  }

  if (error || !product || !shop) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Data Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-gray-500">{error || 'Gagal memuat detail produk atau toko.'}</p>
        <Link
          href="/dashboard/products"
          className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Produk
        </Link>
      </div>
    )
  }

  return (
    <TemplateCanvas
      shop={shop}
      product={product}
      brand={brand}
      initialProductTemplate={initialProductTemplate}
      backUrl="/dashboard/products"
    />
  )
}
