'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import {
  Type,
  Image as ImageIcon,
  Save,
  Trash2,
  MoveUp,
  MoveDown,
  RotateCcw,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { uploadAsset } from '@/lib/supabase/storage'
import { Shop, Product } from '@/types'

const CANVAS_SIZE = 800 // Internal resolution (always 800x800)
const VIEWPORT_PADDING = 40 // Padding around canvas in viewport

interface TemplateCanvasProps {
  shop: Shop
  product?: Product | null
  initialProductTemplate?: any
  backUrl?: string
}

const FONTS = [
  { name: 'Agrandir', label: 'Agrandir (Modern)' },
  { name: 'Comfortaa', label: 'Comfortaa (Rounded)' },
  { name: 'Inter', label: 'Inter (Modern Sans)' },
  { name: 'Montserrat', label: 'Montserrat (Bold Clean)' },
  { name: 'Arial', label: 'Arial (Standard)' },
  { name: 'Times New Roman', label: 'Times New Roman (Serif)' },
  { name: 'Courier New', label: 'Courier New (Mono)' },
]

export default function TemplateCanvas({
  shop,
  product,
  initialProductTemplate,
  backUrl,
}: TemplateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)

  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [textColor, setTextColor] = useState('#1e293b')
  const [fontSize, setFontSize] = useState(32)
  const [fontFamily, setFontFamily] = useState('Comfortaa')
  const [textAlign, setTextAlign] = useState('left')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)


  const supabase = createClient()

  /**
   * Apply zoom using Fabric.js native zoom — keeps mouse coords aligned.
   * The canvas element is resized to (CANVAS_SIZE * zoom), while the
   * internal coordinate space stays 800x800.
   */
  const applyZoom = useCallback((canvas: fabric.Canvas, zoom: number) => {
    canvas.setZoom(zoom)
    canvas.setDimensions(
      { width: CANVAS_SIZE * zoom, height: CANVAS_SIZE * zoom },
    )
    canvas.renderAll()
  }, [])

  /**
   * Calculate the zoom that makes the 800x800 canvas fit inside the viewport container.
   */
  const calcFitZoom = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return 0.6
    const availW = vp.clientWidth - VIEWPORT_PADDING * 2
    const availH = vp.clientHeight - VIEWPORT_PADDING * 2
    const fit = Math.min(availW / CANVAS_SIZE, availH / CANVAS_SIZE)
    // Clamp between 0.3 and 1.5
    return Math.round(Math.min(1.5, Math.max(0.3, fit)) * 100) / 100
  }, [])

  // Initialize Fabric Canvas (800x800 internal resolution)
  useEffect(() => {
    isMountedRef.current = true
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    })

    fabricCanvasRef.current = canvas

    // Selection event listeners
    const handleSelection = () => {
      if (!isMountedRef.current || !canvas.getContext()) return
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
    canvas.on('selection:cleared', () => {
      if (isMountedRef.current) setSelectedObject(null)
    })

    // Load existing template if available
    // Priority: initialProductTemplate -> shop.template_config -> setupDefaultLayout
    const configToLoad =
      initialProductTemplate && Object.keys(initialProductTemplate).length > 0
        ? initialProductTemplate
        : shop.template_config && Object.keys(shop.template_config).length > 0
        ? shop.template_config
        : null

    if (configToLoad) {
      try {
        canvas.loadFromJSON(configToLoad, () => {
          if (isMountedRef.current && canvas.getContext()) {
            // Apply fit zoom after load
            const fitZ = calcFitZoom()
            applyZoom(canvas, fitZ)
          }
        })
      } catch (err) {
        console.error('Failed to load template config:', err)
        if (isMountedRef.current && canvas.getContext()) {
          setupDefaultLayout(canvas)
          const fitZ = calcFitZoom()
          applyZoom(canvas, fitZ)
        }
      }
    } else {
      setupDefaultLayout(canvas)
      // Defer fit zoom so viewport has rendered
      requestAnimationFrame(() => {
        if (isMountedRef.current && canvas.getContext()) {
          const fitZ = calcFitZoom()
          applyZoom(canvas, fitZ)
        }
      })
    }

    // Auto-fit on viewport resize (ResizeObserver)
    const vp = viewportRef.current
    let ro: ResizeObserver | null = null
    if (vp) {
      ro = new ResizeObserver(() => {
        if (!isMountedRef.current || !canvas.getContext()) return
        const fitZ = calcFitZoom()
        applyZoom(canvas, fitZ)
      })
      ro.observe(vp)
    }

    return () => {
      isMountedRef.current = false
      ro?.disconnect()
      try {
        if (canvas && canvas.getContext()) {
          canvas.clear()
          canvas.dispose()
        }
      } catch (e) {
        // ignore cleanup error if context already lost
      }
      fabricCanvasRef.current = null
    }
  }, [shop, applyZoom, calcFitZoom])

  const setupDefaultLayout = (canvas: fabric.Canvas) => {
    if (!canvas.getContext()) return

    // 1. Product Image Placeholder (Centered in 800x800)
    const productBox = new fabric.Rect({
      left: 150,
      top: 150,
      width: 500,
      height: 460,
      fill: '#f1f5f9',
      stroke: '#cbd5e1',
      strokeWidth: 2,
      strokeDashArray: [8, 8],
      rx: 16,
      ry: 16,
      // @ts-ignore
      placeholderType: 'product_image',
    })

    const productLabel = new fabric.Text('', {
      left: 260,
      top: 360,
      fontSize: 18,
      fontFamily: 'Inter',
      fill: '#64748b',
      selectable: false,
    })

    // 2. Brand Logo Placeholder (Top Left)
    const brandLogo = new fabric.Rect({
      left: 40,
      top: 40,
      width: 140,
      height: 70,
      fill: '#f8fafc',
      stroke: '#94a3b8',
      strokeWidth: 1.5,
      strokeDashArray: [4, 4],
      rx: 8,
      ry: 8,
      // @ts-ignore
      placeholderType: 'brand_logo',
    })

    // 3. Shop Logo Placeholder (Top Right)
    const shopLogo = new fabric.Rect({
      left: 620,
      top: 40,
      width: 140,
      height: 70,
      fill: '#f8fafc',
      stroke: '#94a3b8',
      strokeWidth: 1.5,
      strokeDashArray: [4, 4],
      rx: 8,
      ry: 8,
      // @ts-ignore
      placeholderType: 'shop_logo',
    })

    // 4. Product Title Textbox (Bottom)
    const titleText = new fabric.Textbox('Product Title Here\n(Support Multiline)', {
      left: 40,
      top: 640,
      width: 720,
      fontSize: 32,
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

  // --- Background Upload & Setting ---
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBg(true)
    try {
      const { url, error } = await uploadAsset(file, 'shops')
      if (error || !url) {
        throw new Error(error || 'Failed to upload background image')
      }

      const canvas = fabricCanvasRef.current
      if (canvas && canvas.getContext()) {
        fabric.Image.fromURL(
          url,
          (img) => {
            if (img && canvas.getContext()) {
              const scale = Math.max(800 / (img.width || 1), 800 / (img.height || 1))
              img.set({
                originX: 'center',
                originY: 'center',
                left: 400,
                top: 400,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
              })
              canvas.setBackgroundImage(img, () => {
                if (canvas.getContext()) canvas.renderAll()
              })
            }
          },
          { crossOrigin: 'anonymous' }
        )
      }
    } catch (err: any) {
      alert('Error uploading background: ' + err.message)
    } finally {
      setUploadingBg(false)
      if (bgInputRef.current) bgInputRef.current.value = ''
    }
  }

  const handleRemoveBackground = () => {
    const canvas = fabricCanvasRef.current
    if (canvas && canvas.getContext()) {
      // @ts-ignore
      canvas.setBackgroundImage(null, () => {
        if (canvas.getContext()) {
          canvas.setBackgroundColor('#ffffff', () => {
            if (canvas.getContext()) canvas.renderAll()
          })
        }
      })
    }
  }

  // --- Canvas Actions ---
  const addText = (type: 'title' | 'description' | 'custom') => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !canvas.getContext()) return

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
    if (!canvas || !canvas.getContext()) return

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
    if (!canvas || !canvas.getContext()) return

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
    if (canvas && activeObj && canvas.getContext()) {
      canvas.bringForward(activeObj)
      canvas.renderAll()
    }
  }

  const sendBackward = () => {
    const canvas = fabricCanvasRef.current
    const activeObj = canvas?.getActiveObject()
    if (canvas && activeObj && canvas.getContext()) {
      canvas.sendBackwards(activeObj)
      canvas.renderAll()
    }
  }

  const updateActiveText = (prop: string, value: any) => {
    const canvas = fabricCanvasRef.current
    const activeObj = canvas?.getActiveObject()
    if (activeObj && activeObj.type === 'textbox' && canvas?.getContext()) {
      activeObj.set(prop as any, value)
      canvas.renderAll()
    }
  }



  const handleSaveTemplate = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setSaving(true)
    setSaveSuccess(false)

    try {
      // Temporarily reset zoom to 1:1 so saved JSON has clean coordinates
      const currentZoom = canvas.getZoom()
      canvas.setZoom(1)
      canvas.setDimensions({ width: CANVAS_SIZE, height: CANVAS_SIZE })

      const jsonConfig = canvas.toJSON(['placeholderType', 'id', 'name'])

      // Restore zoom
      canvas.setZoom(currentZoom)
      canvas.setDimensions({
        width: CANVAS_SIZE * currentZoom,
        height: CANVAS_SIZE * currentZoom,
      })
      canvas.renderAll()

      if (product) {
        // Save/upsert to product_templates table
        const { error } = await supabase
          .from('product_templates')
          .upsert(
            {
              product_id: product.id,
              shop_id: shop.id,
              template_config: jsonConfig,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'product_id,shop_id' }
          )

        if (error) throw error
      } else {
        // Save to shops table
        const { error } = await supabase
          .from('shops')
          .update({
            template_config: jsonConfig,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shop.id)

        if (error) throw error
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      alert('Failed to save template: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl || (product ? '/dashboard/products' : '/dashboard/shops')}
            className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {product ? (
                <>
                  Template Gambar Produk: <span className="text-indigo-600">{product.name}</span>
                </>
              ) : (
                <>
                  Template Builder: <span className="text-indigo-600">{shop.name}</span>
                </>
              )}
            </h1>
            <p className="text-xs text-gray-500">
              {product ? (
                <>
                  Kustomisasi template untuk toko <span className="font-semibold text-gray-700">{shop.name}</span>. Template default toko tidak akan terpengaruh.
                </>
              ) : (
                'Atur posisi elemen, background image, font, dan ukuran untuk gambar produk toko ini.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const canvas = fabricCanvasRef.current
              if (canvas && canvas.getContext() && confirm('Reset canvas ke layout default?')) {
                const z = canvas.getZoom()
                canvas.clear()
                canvas.setBackgroundColor('#ffffff', () => {
                  if (canvas.getContext()) {
                    setupDefaultLayout(canvas)
                    applyZoom(canvas, z)
                  }
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-stretch flex-1 min-h-0 mt-4 overflow-hidden">
        {/* Left Toolbar (scrollable) */}
        <div className="space-y-4 lg:col-span-3 overflow-y-auto max-h-full pr-1">
          {/* Background Image Upload */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 className="flex items-center text-sm font-semibold text-gray-900">
              <ImageIcon className="mr-2 h-4 w-4 text-indigo-600" />
              Template Background
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Unggah gambar latar khusus untuk template toko ini.
            </p>

            <input
              type="file"
              ref={bgInputRef}
              onChange={handleBackgroundUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                disabled={uploadingBg}
                className="flex w-full items-center justify-center rounded-xl bg-indigo-50 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                {uploadingBg ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Mengunggah Background...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload Background Image
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRemoveBackground}
                className="w-full rounded-xl border border-gray-200 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Hapus Background (Reset Putih)
              </button>
            </div>
          </div>

          {/* Add Text Elements */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 className="flex items-center text-sm font-semibold text-gray-900">
              <Type className="mr-2 h-4 w-4 text-indigo-600" />
              Komponen Teks
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
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 className="flex items-center text-sm font-semibold text-gray-900">
              <ImageIcon className="mr-2 h-4 w-4 text-indigo-600" />
              Placeholder Gambar
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
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
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

        {/* Center: Canvas Viewport — auto-fit */}
        <div className="flex flex-col lg:col-span-6 min-h-0 overflow-hidden">

          {/* Viewport — canvas floats centered inside this area */}
          <div
            ref={viewportRef}
            className="flex-1 min-h-0 flex items-center justify-center rounded-2xl overflow-auto"
            style={{ background: '#e8e8e8', backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            <div className="shrink-0" style={{ padding: `${VIEWPORT_PADDING}px` }}>
              <div
                className="shadow-2xl"
                style={{ lineHeight: 0 }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Property Inspector (scrollable) */}
        <div className="space-y-4 lg:col-span-3 overflow-y-auto max-h-full pl-1">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Properties</h3>

            {selectedObject ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs text-gray-500">Selected Type</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {/* @ts-ignore */}
                    {selectedObject.placeholderType || selectedObject.type}
                  </span>
                </div>

                {selectedObject.type === 'textbox' && (
                  <>
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
                            className={`flex-1 rounded-lg py-1 text-xs capitalize ${textAlign === align
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
                Klik elemen apa saja di kanvas untuk mengubah properti & ukurannya.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
