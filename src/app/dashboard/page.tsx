'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Tag, Store, Package, ArrowRight, Sparkles, TrendingUp, ImageIcon } from 'lucide-react'

interface Stats {
  brands: number
  shops: number
  products: number
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  gradient,
  loading,
}: {
  label: string
  value: number
  icon: React.ElementType
  href: string
  gradient: string
  loading: boolean
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-2 text-4xl font-bold text-white">
            {loading ? (
              <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-white/20" />
            ) : (
              value
            )}
          </p>
        </div>
        <div className="rounded-xl bg-white/20 p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm text-white/80 transition-all group-hover:text-white">
        <span>Kelola {label}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ brands: 0, shops: 0, products: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const [brandsRes, shopsRes, productsRes] = await Promise.all([
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('shops').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        brands: brandsRes.count ?? 0,
        shops: shopsRes.count ?? 0,
        products: productsRes.count ?? 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [supabase])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-lg">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            <span>BebeShopman Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{greeting}! 👋</h1>
          <p className="mt-2 text-indigo-200 max-w-lg">
            Kelola brand, toko, dan produk Anda. Generate gambar produk marketplace berkualitas tinggi dengan AI.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Ringkasan Data
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Brands"
            value={stats.brands}
            icon={Tag}
            href="/dashboard/brands"
            gradient="linear-gradient(135deg, #4F46E5, #6D28D9)"
            loading={loading}
          />
          <StatCard
            label="Shops"
            value={stats.shops}
            icon={Store}
            href="/dashboard/shops"
            gradient="linear-gradient(135deg, #0EA5E9, #2563EB)"
            loading={loading}
          />
          <StatCard
            label="Products"
            value={stats.products}
            icon={Package}
            href="/dashboard/products"
            gradient="linear-gradient(135deg, #10B981, #059669)"
            loading={loading}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickActionCard
            title="Tambah Brand Baru"
            description="Daftarkan brand dan upload logo brand Anda"
            href="/dashboard/brands"
            icon={Tag}
          />
          <QuickActionCard
            title="Tambah Toko Baru"
            description="Daftarkan toko marketplace (Shopee, Tokopedia, dll)"
            href="/dashboard/shops"
            icon={Store}
          />
          <QuickActionCard
            title="Tambah Produk"
            description="Upload foto produk untuk diproses oleh AI"
            href="/dashboard/products"
            icon={Package}
          />
          <QuickActionCard
            title="Generate Gambar Produk"
            description="Buat gambar marketplace massal dari template toko"
            href="/dashboard/products"
            icon={ImageIcon}
          />
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <div>
          <p className="font-semibold text-indigo-900">Alur Kerja yang Disarankan</p>
          <p className="mt-1 text-sm text-indigo-700">
            <strong>1. Brand</strong> → tambahkan brand dan logo ·{' '}
            <strong>2. Shops</strong> → daftarkan toko & atur template ·{' '}
            <strong>3. Products</strong> → upload foto produk ·{' '}
            <strong>4. Generate</strong> → buat gambar marketplace massal
          </p>
        </div>
      </div>
    </div>
  )
}
