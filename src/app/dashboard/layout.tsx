'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tag, Store, Package, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Brands', href: '/dashboard/brands', icon: Tag },
  { name: 'Shops', href: '/dashboard/shops', icon: Store },
  { name: 'Products', href: '/dashboard/products', icon: Package },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex w-64 flex-col bg-white shadow-md">
        <div className="flex h-16 shrink-0 items-center px-6">
          <span className="text-xl font-bold text-indigo-600">Bebe Shopman</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 space-y-1 px-4 text-sm">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
