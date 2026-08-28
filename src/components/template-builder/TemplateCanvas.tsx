'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import {
  Type,
  Image as ImageIcon,
  Save,
  Trash2,
  MoveUp,
  MoveDown,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shop } from '@/types'

interface TemplateCanvasProps {
  shop: Shop
}

const FONTS = [
  { name: 'Comfortaa', label: 'Comfortaa (Rounded)' },
  { name: 'Inter', label: 'Inter (Modern Sans)' },
  { name: 'Montserrat', label: 'Montserrat (Bold Clean)' },
  { name: 'Arial', label: 'Arial (Standard)' },
  { name: 'Times New Roman', label: 'Times New Roman (Serif)' },
  { name: 'Courier New', label: 'Courier New (Mono)' },
]

export default function TemplateCanvas({ shop }: TemplateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)

  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [textColor, setTextColor] = useState('#1e293b')
  const [fontSize, setFontSize] = useState(32)
  const [fontFamily, setFontFamily] = useState('Comfortaa')
  const [textAlign, setTextAlign] = useState('left')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const supabase = createClient()

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    })

    fabricCanvasRef.current = canvas

    // Selection event listeners
    const handleSelection = () => {
      const activeObj = canvas.getActiveObject()
      setSelectedObject(activeObj || null)

      if (activeObj && activeObj.type === 'textbox') {
        const textObj = activeObj as fabric.Textbox
        setTextColor((textObj.fill as string) || '#1e293b')
        setFontSize(textObj.fontSize || 32)
        setFontFamily(textObj.fontFamily || 'Comfortaa')
        setTextAlign(textObj.textAlign || 'left')
      }
    }

    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => setSelectedObject(null))

    // Load existing template if available
    if (shop.template_config && Object.keys(shop.template_config).length > 0) {
      canvas.loadFromJSON(shop.template_config, () => {
        canvas.renderAll()
      })
    } else {
      // Setup default template layout if empty
      setupDefaultLayout(canvas)
    }

    return () => {
      canvas.dispose()
    }
  }, [shop])

  const setupDefaultLayout = (canvas: fabric.Canvas) => {
    // 1. Product Image Placeholder
    const productBox = new fabric.Rect({
      left: 100,
      top: 120,
      width: 400,
      height: 360,
      fill: '#f1f5f9',
      stroke: '#cbd5e1',
      strokeWidth: 2,
      strokeDashArray: [6, 6],
      rx: 12,
      ry: 12,
      // @ts-ignore
      placeholderType: 'product_image',
    })

    const productLabel = new fabric.Text('Main Product Image Placeholder', {
      left: 170,
      top: 290,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#64748b',
      selectable: false,
    })

    // 2. Brand Logo Placeholder
    const brandLogo = new fabric.Rect({
      left: 30,
      top: 30,
      width: 100,
      height: 50,
      fill: '#f8fafc',
      stroke: '#94a3b8',
      strokeWidth: 1.5,
      strokeDashArray: [4, 4],
      rx: 6,
      ry: 6,
      // @ts-ignore
      placeholderType: 'brand_logo',
    })

    // 3. Shop Logo Placeholder
    const shopLogo = new fabric.Rect({
      left: 470,
      top: 30,
      width: 100,
      height: 50,
      fill: '#f8fafc',
      stroke: '#94a3b8',
      strokeWidth: 1.5,
      strokeDashArray: [4, 4],
      rx: 6,
      ry: 6,
      // @ts-ignore
      placeholderType: 'shop_logo',
    })

    // 4. Product Title Textbox
    const titleText = new fabric.Textbox('Product Title Here\n(Support Multiline)', {
      left: 30,
      top: 500,
      width: 540,
      fontSize: 24,
      fontFamily: 'Comfortaa',
      fontWeight: 'bold',
      fill: '#0f172a',
      textAlign: 'center',
      // @ts-ignore
      placeholderType: 'product_title',
    })

    canvas.add(productBox, productLabel, brandLogo, shopLogo, titleText)
    canvas.renderAll()
  }

  // --- Canvas Actions ---

  const addText = (type: 'title' | 'description' | 'custom') => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let textContent = 'Sample Text'
    let size = 20
    let placeholderType = 'custom_text'
    let font = 'Comfortaa'

    if (type === 'title') {
      textContent = 'Product Title Placeholder'
      size = 28
      placeholderType = 'product_title'
      font = 'Comfortaa'
    } else if (type === 'description') {
      textContent = 'Short product description or features goes here.'
      size = 16
      placeholderType = 'product_desc'
      font = 'Inter'
    }

    const textbox = new fabric.Textbox(textContent, {
      left: 100,
      top: 100,
      width: 300,
      fontSize: size,
      fontFamily: font,
      fill: textColor,
      // @ts-ignore
      placeholderType,
    })

    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    canvas.renderAll()
  }

  const addPlaceholderBox = (type: 'product_image' | 'brand_logo' | 'shop_logo') => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const labelMap = {
      product_image: 'Product Image',
      brand_logo: 'Brand Logo',
      shop_logo: 'Shop Logo',
    }

    const sizeMap = {
      product_image: { w: 300, h: 300 },
      brand_logo: { w: 120, h: 60 },
      shop_logo: { w: 120, h: 60 },
    }

    const box = new fabric.Rect({
      left: 150,
      top: 150,
      width: sizeMap[type].w,
      height: sizeMap[type].h,
      fill: '#f8fafc',
      stroke: '#6366f1',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      rx: 8,
      ry: 8,
      // @ts-ignore
      placeholderType: type,
    })

    canvas.add(box)
    canvas.setActiveObject(box)
    canvas.renderAll()
  }

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObj = canvas.getActiveObject()
    if (activeObj) {
      canvas.remove(activeObj)
      canvas.discardActiveObject()
      canvas.renderAll()
    }
  }

  const bringForward = () => {
    const canvas = fabricCanvasRef.current
    const activeObj = canvas?.getActiveObject()
    if (canvas && activeObj) {
      canvas.bringForward(activeObj)
      canvas.renderAll()
    }
  }

  const sendBackward = () => {
    const canvas = fabricCanvasRef.current
    const activeObj = canvas?.getActiveObject()
    if (canvas && activeObj) {
      canvas.sendBackwards(activeObj)
      canvas.renderAll()
    }
  }

  // Update active text properties
  const updateActiveText = (prop: string, value: any) => {
    const canvas = fabricCanvasRef.current
    const activeObj = canvas?.getActiveObject()
    if (activeObj && activeObj.type === 'textbox') {
      activeObj.set(prop as any, value)
      canvas?.renderAll()
    }
  }

  const handleSaveTemplate = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setSaving(true)
    setSaveSuccess(false)

    try {
      // Export canvas with custom placeholder attributes
      const jsonConfig = canvas.toJSON(['placeholderType', 'id', 'name'])

      const { error } = await supabase
        .from('shops')
        .update({
          template_config: jsonConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shop.id)

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      alert('Failed to save template: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/shops"
            className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Template Builder: <span className="text-indigo-600">{shop.name}</span>
            </h1>
            <p className="text-xs text-gray-500">
              Define component positions, fonts, and sizes for this shop&apos;s product images.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const canvas = fabricCanvasRef.current
              if (canvas && confirm('Reset canvas to default layout?')) {
                canvas.clear()
                canvas.setBackgroundColor('#ffffff', () => {
                  setupDefaultLayout(canvas)
                })
              }
            }}
            className="flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset Layout
          </button>

          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-300" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Editor Main Area: Left Toolbar + Center Canvas + Right Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Toolbar */}
        <div className="space-y-4 lg:col-span-3">
          {/* Add Text Elements */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="flex items-center text-sm font-semibold text-gray-900">
              <Type className="mr-2 h-4 w-4 text-indigo-600" />
              Add Text Components
            </h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => addText('title')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50/30"
              >
                + Product Title
              </button>
              <button
                onClick={() => addText('description')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50/30"
              >
                + Product Description
              </button>
              <button
                onClick={() => addText('custom')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50/30"
              >
                + Custom Text
              </button>
            </div>
          </div>

          {/* Add Image Placeholders */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="flex items-center text-sm font-semibold text-gray-900">
              <ImageIcon className="mr-2 h-4 w-4 text-indigo-600" />
              Image Placeholders
            </h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => addPlaceholderBox('product_image')}
                className="w-full rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 px-3 py-2 text-left text-xs font-medium text-indigo-700 transition hover:bg-indigo-50"
              >
                + Main Product Box
              </button>
              <button
                onClick={() => addPlaceholderBox('brand_logo')}
                className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-gray-100"
              >
                + Brand Logo Box
              </button>
              <button
                onClick={() => addPlaceholderBox('shop_logo')}
                className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-gray-100"
              >
                + Shop Logo Box
              </button>
            </div>
          </div>

          {/* Layer Ordering */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Layer Controls</h3>
            <div className="mt-3 flex gap-2">
              <button
                onClick={bringForward}
                disabled={!selectedObject}
                className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <MoveUp className="mr-1 h-3.5 w-3.5" /> Forward
              </button>
              <button
                onClick={sendBackward}
                disabled={!selectedObject}
                className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <MoveDown className="mr-1 h-3.5 w-3.5" /> Backward
              </button>
            </div>
          </div>
        </div>

        {/* Center: Canvas Viewport */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-100 p-6 shadow-inner lg:col-span-6">
          <div className="relative overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl">
            <canvas ref={canvasRef} />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            600 x 600 Canvas Area • Drag, scale or rotate elements freely
          </p>
        </div>

        {/* Right: Property Inspector */}
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Properties</h3>

            {selectedObject ? (
              <div className="mt-4 space-y-4">
                {/* Object Type Badge */}
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs text-gray-500">Selected Type</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {/* @ts-ignore */}
                    {selectedObject.placeholderType || selectedObject.type}
                  </span>
                </div>

                {/* Text Formatting Controls */}
                {selectedObject.type === 'textbox' && (
                  <>
                    {/* Font Family */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Font Family
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => {
                          setFontFamily(e.target.value)
                          updateActiveText('fontFamily', e.target.value)
                        }}
                        className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none"
                      >
                        {FONTS.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-gray-700">
                        <span>Font Size</span>
                        <span>{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={fontSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setFontSize(val)
                          updateActiveText('fontSize', val)
                        }}
                        className="mt-2 w-full accent-indigo-600"
                      />
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Text Color
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value)
                            updateActiveText('fill', e.target.value)
                          }}
                          className="h-8 w-8 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                        />
                        <span className="text-xs font-mono text-gray-600">
                          {textColor}
                        </span>
                      </div>
                    </div>

                    {/* Alignment */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Text Alignment
                      </label>
                      <div className="mt-1 flex gap-1 rounded-xl bg-gray-100 p-1">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            onClick={() => {
                              setTextAlign(align)
                              updateActiveText('textAlign', align)
                            }}
                            className={`flex-1 rounded-lg py-1 text-xs capitalize ${
                              textAlign === align
                                ? 'bg-white font-semibold text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Delete Object Action */}
                <div className="border-t pt-3">
                  <button
                    onClick={deleteSelected}
                    className="flex w-full items-center justify-center rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Selected
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                Click any element on the canvas to inspect and customize its properties.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
