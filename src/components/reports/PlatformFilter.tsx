'use client'

interface PlatformFilterProps {
  value: string
  onChange: (value: string) => void
}

export function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const options = [
    { id: 'all', label: 'Semua Platform' },
    { id: 'shopee', label: 'Shopee' },
    { id: 'tiktok', label: 'TikTok Shop' },
  ]

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {options.map(option => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === option.id
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
