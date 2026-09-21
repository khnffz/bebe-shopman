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
  Download,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { uploadAsset } from '@/lib/supabase/storage'
import { Shop, Product, Brand } from '@/types'

const CANVAS_SIZE = 800 // Internal resolution (always 800x800)
const VIEWPORT_PADDING = 40 // Padding around canvas in viewport

interface TemplateCanvasProps {
  shop: Shop
  product?: Product | null
  brand?: Brand | null
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadFabricImage(url: string): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) reject(new Error(`Gagal memuat gambar: ${url}`))
        else resolve(img)
      },
      { crossOrigin: 'anonymous' }
    )
  })
}

function localFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TemplateCanvas({
  shop,
  product,
  brand,
  initialProductTemplate,
  backUrl,
}: TemplateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const productImgInputRef = useRef<HTMLInputElement>(null)
  const brandLogoInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)

  // Canvas selection state
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [textColor, setTextColor] = useState('#1e293b')
  const [fontSize, setFontSize] = useState(32)
  const [fontFamily, setFontFamily] = useState('Comfortaa')
  const [textAlign, setTextAlign] = useState('left')

  // Action state
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Preview override state (local, not persisted to DB)
  const [previewProductName, setPreviewProductName] = useState(product?.name ?? '')
  const [previewProductDesc, setPreviewProductDesc] = useState(product?.description ?? '')
  const [previewProductImageUrl, setPreviewProductImageUrl] = useState<string | null>(
    product?.raw_image_url ?? null
  )
  const [previewBrandLogoUrl, setPreviewBrandLogoUrl] = useState<string | null>(
    brand?.logo_url ?? null
  )

  const supabase = createClient()

  // ── Zoom helpers ────────────────────────────────────────────────────────────

  const applyZoom = useCallback((canvas: fabric.Canvas, zoom: number) => {
    canvas.setZoom(zoom)
    canvas.setDimensions({ width: CANVAS_SIZE * zoom, height: CANVAS_SIZE * zoom })
    canvas.renderAll()
  }, [])

  const calcFitZoom = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return 0.6
    const availW = vp.clientWidth - VIEWPORT_PADDING * 2
    const availH = vp.clientHeight - VIEWPORT_PADDING * 2
    const fit = Math.min(availW / CANVAS_SIZE, availH / CANVAS_SIZE)
    return Math.round(Math.min(1.5, Math.max(0.3, fit)) * 100) / 100
  }, [])

  // ── Preview overlay logic ───────────────────────────────────────────────────

  /** Remove all overlay preview objects from canvas (tagged with isPreviewOverlay). */
  const clearPreviewOverlays = useCallback((canvas: fabric.Canvas) => {
    const toRemove = canvas.getObjects().filter((o) => (o as any).isPreviewOverlay)
    toRemove.forEach((o) => canvas.remove(o))
  }, [])

  /**
   * Render live preview overlays on top of placeholders.
   * This does NOT modify the placeholder objects themselves — preserving template_config.
   */
  const renderPreviewOverlays = useCallback(
    async (
      canvas: fabric.Canvas,
      opts: {
        productName: string
        productDesc: string
        productImageUrl: string | null
        brandLogoUrl: string | null
      }
    ) => {
      if (!canvas.getContext()) return

      clearPreviewOverlays(canvas)

      const objects = canvas.getObjects()

      for (const obj of objects) {
        const pType = (obj as any).placeholderType
        if (!pType) continue

        if (pType === 'product_image' && opts.productImageUrl) {
          try {
            const prodImg = await loadFabricImage(opts.productImageUrl)
            const targetW = (obj.width || 400) * (obj.scaleX || 1)
            const targetH = (obj.height || 400) * (obj.scaleY || 1)
            const scale =
              Math.min(targetW / (prodImg.width || 1), targetH / (prodImg.height || 1)) * 0.92

            prodImg.set({
              left: (obj.left || 0) + (targetW - (prodImg.width || 1) * scale) / 2,
              top: (obj.top || 0) + (targetH - (prodImg.height || 1) * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: true,
              evented: true,
              // @ts-ignore
              isPreviewOverlay: true,
              placeholderType: 'product_image_overlay',
            })
            canvas.add(prodImg)
          } catch (e) {
            console.warn('Preview: could not render product image', e)
          }
        } else if (pType === 'brand_logo' && opts.brandLogoUrl) {
          try {
            const brandImg = await loadFabricImage(opts.brandLogoUrl)
            const targetW = (obj.width || 120) * (obj.scaleX || 1)
            const targetH = (obj.height || 60) * (obj.scaleY || 1)
            const scale = Math.min(targetW / (brandImg.width || 1), targetH / (brandImg.height || 1))

            brandImg.set({
              left: (obj.left || 0) + (targetW - (brandImg.width || 1) * scale) / 2,
              top: (obj.top || 0) + (targetH - (brandImg.height || 1) * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: true,
              evented: true,
              // @ts-ignore
              isPreviewOverlay: true,
              placeholderType: 'brand_logo_overlay',
            })
            canvas.add(brandImg)
          } catch (e) {
            console.warn('Preview: could not render brand logo', e)
          }
        } else if (pType === 'shop_logo' && shop.logo_url) {
          try {
            const shopImg = await loadFabricImage(shop.logo_url)
            const targetW = (obj.width || 120) * (obj.scaleX || 1)
            const targetH = (obj.height || 60) * (obj.scaleY || 1)
            const scale = Math.min(targetW / (shopImg.width || 1), targetH / (shopImg.height || 1))

            shopImg.set({
              left: (obj.left || 0) + (targetW - (shopImg.width || 1) * scale) / 2,
              top: (obj.top || 0) + (targetH - (shopImg.height || 1) * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: true,
              evented: true,
              // @ts-ignore
              isPreviewOverlay: true,
              placeholderType: 'shop_logo_overlay',
            })
            canvas.add(shopImg)
          } catch (e) {
            console.warn('Preview: could not render shop logo', e)
          }
        } else if (pType === 'product_title' && obj.type === 'textbox') {
          const tb = obj as fabric.Textbox
          tb.set({ text: opts.productName || product?.name || '' })
        } else if (pType === 'product_desc' && obj.type === 'textbox') {
          const tb = obj as fabric.Textbox
          tb.set({ text: opts.productDesc || product?.description || '' })
        }
      }

      canvas.renderAll()
    },
    [clearPreviewOverlays, product, shop.logo_url]
  )

  // ── Canvas init ─────────────────────────────────────────────────────────────

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

    const configToLoad =
      initialProductTemplate && Object.keys(initialProductTemplate).length > 0
        ? initialProductTemplate
        : shop.template_config && Object.keys(shop.template_config).length > 0
        ? shop.template_config
        : null

    const afterLoad = async () => {
      if (!isMountedRef.current || !canvas.getContext()) return
      const fitZ = calcFitZoom()
      applyZoom(canvas, fitZ)

      // Render live preview overlays after template is loaded
      if (product) {
        await renderPreviewOverlays(canvas, {
          productName: product.name,
          productDesc: product.description ?? '',
          productImageUrl: product.raw_image_url,
          brandLogoUrl: brand?.logo_url ?? null,
        })
      }
    }

    if (configToLoad) {
      try {
        canvas.loadFromJSON(configToLoad, () => afterLoad())
      } catch (err) {
        console.error('Failed to load template config:', err)
        if (isMountedRef.current && canvas.getContext()) {
          setupDefaultLayout(canvas)
          afterLoad()
        }
      }
    } else {
      setupDefaultLayout(canvas)
      requestAnimationFrame(() => afterLoad())
    }

    // Auto-fit on resize
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop])

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
    const titleText = new fabric.Textbox(product?.name || 'Product Title Here', {
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

  // ── Background Upload ────────────────────────────────────────────────────────

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBg(true)
    try {
      const { url, error } = await uploadAsset(file, 'shops')
      if (error || !url) throw new Error(error || 'Failed to upload background image')

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

  // ── Preview Override Handlers ─────────────────────────────────────────────────

  /** Refresh preview overlays with current override state */
  const refreshPreview = useCallback(
    async (overrides?: {
      productName?: string
      productDesc?: string
      productImageUrl?: string | null
      brandLogoUrl?: string | null
    }) => {
      const canvas = fabricCanvasRef.current
      if (!canvas || !canvas.getContext()) return

      await renderPreviewOverlays(canvas, {
        productName: overrides?.productName ?? previewProductName,
        productDesc: overrides?.productDesc ?? previewProductDesc,
        productImageUrl: overrides?.productImageUrl !== undefined ? overrides.productImageUrl : previewProductImageUrl,
        brandLogoUrl: overrides?.brandLogoUrl !== undefined ? overrides.brandLogoUrl : previewBrandLogoUrl,
      })
    },
    [renderPreviewOverlays, previewProductName, previewProductDesc, previewProductImageUrl, previewBrandLogoUrl]
  )

  const handleProductImageOverride = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await localFileToDataUrl(file)
      setPreviewProductImageUrl(dataUrl)
      await refreshPreview({ productImageUrl: dataUrl })
    } catch (err) {
      console.error('Failed to load product image override:', err)
    } finally {
      if (productImgInputRef.current) productImgInputRef.current.value = ''
    }
  }

  const handleBrandLogoOverride = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await localFileToDataUrl(file)
      setPreviewBrandLogoUrl(dataUrl)
      await refreshPreview({ brandLogoUrl: dataUrl })
    } catch (err) {
      console.error('Failed to load brand logo override:', err)
    } finally {
      if (brandLogoInputRef.current) brandLogoInputRef.current.value = ''
    }
  }

  const handleProductNameChange = async (value: string) => {
    setPreviewProductName(value)
    // Live-update product_title textboxes on canvas
    const canvas = fabricCanvasRef.current
    if (!canvas || !canvas.getContext()) return
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).placeholderType === 'product_title' && obj.type === 'textbox') {
        ;(obj as fabric.Textbox).set({ text: value })
      }
    })
    canvas.renderAll()
  }

  const handleProductDescChange = async (value: string) => {
    setPreviewProductDesc(value)
    // Live-update product_desc textboxes on canvas
    const canvas = fabricCanvasRef.current
    if (!canvas || !canvas.getContext()) return
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).placeholderType === 'product_desc' && obj.type === 'textbox') {
        ;(obj as fabric.Textbox).set({ text: value })
      }
    })
    canvas.renderAll()
  }

  // ── Canvas Actions ───────────────────────────────────────────────────────────

  const addText = (type: 'title' | 'description' | 'custom') => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !canvas.getContext()) return

    let textContent = 'Sample Text'
    let size = 20
    let placeholderType = 'custom_text'
    let font = 'Comfortaa'

    if (type === 'title') {
      textContent = previewProductName || 'Product Title Placeholder'
      size = 28
      placeholderType = 'product_title'
      font = 'Comfortaa'
    } else if (type === 'description') {
      textContent = previewProductDesc || 'Short product description or features goes here.'
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

  // ── Save Template ────────────────────────────────────────────────────────────

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

      // Exclude preview overlay objects from saved config
      const allObjects = canvas.getObjects()
      const overlays = allObjects.filter((o) => (o as any).isPreviewOverlay)
      overlays.forEach((o) => canvas.remove(o))

      const jsonConfig = canvas.toJSON(['placeholderType', 'id', 'name', 'isPreviewOverlay'])

      // Re-add overlays
      overlays.forEach((o) => canvas.add(o))

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

  // ── Export PNG ───────────────────────────────────────────────────────────────

  const handleExportPng = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setExporting(true)
    try {
      const currentZoom = canvas.getZoom()

      // Reset to 1:1 for full resolution export
      canvas.setZoom(1)
      canvas.setDimensions({ width: CANVAS_SIZE, height: CANVAS_SIZE })
      canvas.renderAll()

      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 })

      // Restore zoom
      canvas.setZoom(currentZoom)
      canvas.setDimensions({
        width: CANVAS_SIZE * currentZoom,
        height: CANVAS_SIZE * currentZoom,
      })
      canvas.renderAll()

      // Build filename
      const productSlug = (product?.name || 'template')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const shopSlug = shop.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const filename = `${productSlug}-${shopSlug}.png`

      // Trigger download
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err: any) {
      alert('Failed to export: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const canvas = fabricCanvasRef.current
              if (canvas && canvas.getContext() && confirm('Reset canvas ke layout default?')) {
                const z = canvas.getZoom()
                canvas.clear()
                canvas.setBackgroundColor('#ffffff', async () => {
                  if (canvas.getContext()) {
                    setupDefaultLayout(canvas)
                    applyZoom(canvas, z)
                    if (product) {
                      await renderPreviewOverlays(canvas, {
                        productName: previewProductName,
                        productDesc: previewProductDesc,
                        productImageUrl: previewProductImageUrl,
                        brandLogoUrl: previewBrandLogoUrl,
                      })
                    }
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
            onClick={handleExportPng}
            disabled={exporting}
            className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            {exporting ? 'Exporting...' : 'Export PNG'}
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
          <div
            ref={viewportRef}
            className="flex-1 min-h-0 flex items-center justify-center rounded-2xl overflow-auto"
            style={{
              background: '#e8e8e8',
              backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <div className="shrink-0" style={{ padding: `${VIEWPORT_PADDING}px` }}>
              <div className="shadow-2xl" style={{ lineHeight: 0 }}>
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Property Inspector (scrollable) */}
        <div className="space-y-4 lg:col-span-3 overflow-y-auto max-h-full pl-1">

          {/* ── Data Produk Override Panel ────────────────────────────────────── */}
          {product && (
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                Data Produk
              </h3>
              <p className="mt-1 text-[11px] text-gray-400 leading-tight">
                Override sementara untuk preview canvas. Tidak mengubah database.
              </p>

              <div className="mt-4 space-y-4">
                {/* Product Raw Image Override */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Gambar Produk Raw
                  </label>
                  <input
                    type="file"
                    ref={productImgInputRef}
                    onChange={handleProductImageOverride}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  {previewProductImageUrl && (
                    <div className="mb-2 flex h-20 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewProductImageUrl}
                        alt="product preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => productImgInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {previewProductImageUrl ? 'Ganti Gambar' : 'Upload Gambar'}
                  </button>
                </div>

                {/* Product Name Override */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    value={previewProductName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                    placeholder="Nama produk..."
                  />
                </div>

                {/* Product Description Override */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Deskripsi Produk
                  </label>
                  <textarea
                    value={previewProductDesc}
                    onChange={(e) => handleProductDescChange(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                    placeholder="Deskripsi produk..."
                  />
                </div>

                {/* Brand Logo Override */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Logo Brand
                  </label>
                  <input
                    type="file"
                    ref={brandLogoInputRef}
                    onChange={handleBrandLogoOverride}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  {previewBrandLogoUrl && (
                    <div className="mb-2 flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewBrandLogoUrl}
                        alt="brand logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => brandLogoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {previewBrandLogoUrl ? 'Ganti Logo Brand' : 'Upload Logo Brand'}
                  </button>
                </div>

                {/* Refresh Preview Button */}
                <button
                  type="button"
                  onClick={() => refreshPreview()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh Preview
                </button>
              </div>
            </div>
          )}

          {/* ── Properties Panel ─────────────────────────────────────────────── */}
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
                        <span className="text-xs font-mono text-gray-600">{textColor}</span>
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
                Klik elemen apa saja di kanvas untuk mengubah properti &amp; ukurannya.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
