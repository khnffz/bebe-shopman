import { fabric } from 'fabric'
import { Shop, Brand, Product } from '@/types'

/**
 * Loads an image from a URL or data URL into a fabric.Image instance safely.
 */
export function loadFabricImage(url: string): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img) {
          reject(new Error(`Gagal memuat gambar: ${url}`))
        } else {
          resolve(img)
        }
      },
      { crossOrigin: 'anonymous' }
    )
  })
}

/**
 * Removes background using client-side AI library (@imgly/background-removal)
 * Runs 100% locally in browser (free, fast, no external API issues).
 * Returns base64 DataURL (image/png).
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const { removeBackground: removeBgClient } = await import('@imgly/background-removal')
    const blob = await removeBgClient(imageUrl, {
      progress: (key, current, total) => {
        console.log(`[RemoveBG Progress] ${key}: ${current}/${total}`)
      },
    })

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (clientErr: any) {
    console.warn('Client background removal encountered an issue, trying backend fallback...', clientErr)

    // Fallback to backend route if client-side webassembly fails
    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (response.ok) {
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
    } catch (apiErr) {
      console.warn('Backend fallback also failed, using original image:', apiErr)
    }

    // Graceful fallback to original image if background removal fails
    return imageUrl
  }
}

/**
 * Processes a raw product image: removes background and bakes a shadow into it.
 * Returns a Blob (image/png) ready to be uploaded.
 */
export async function processProductImageOffline(imageUrl: string): Promise<Blob> {
  const transparentImgUrl = await removeBackground(imageUrl)
  const img = await loadFabricImage(transparentImgUrl)

  // Add padding for the shadow so it doesn't get clipped
  const padding = 100
  const canvasEl = document.createElement('canvas')
  canvasEl.width = (img.width || 400) + padding
  canvasEl.height = (img.height || 400) + padding

  const canvas = new fabric.StaticCanvas(canvasEl, {
    width: canvasEl.width,
    height: canvasEl.height,
  })

  img.set({
    left: padding / 2,
    top: padding / 2,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.18)',
      blur: 24,
      offsetX: 0,
      offsetY: 14,
    }),
  })

  canvas.add(img)
  canvas.renderAll()

  const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 })
  canvas.dispose()

  // Convert Data URL to Blob
  const res = await fetch(dataUrl)
  return await res.blob()
}

export interface GenerateMainImageParams {
  shop: Shop
  product: Product
  brand: Brand | null
  transparentProductImageUrl: string
  templateConfig?: any
}

/**
 * Generates the Main Product Image based on the Shop's template configuration.
 * Returns a base64 DataURL (image/png).
 */
export async function generateMainProductImage({
  shop,
  product,
  brand,
  transparentProductImageUrl,
  templateConfig: customTemplateConfig,
}: GenerateMainImageParams): Promise<string> {
  if (!transparentProductImageUrl) {
    throw new Error('Gambar produk belum tersedia. Silakan upload gambar produk terlebih dahulu.')
  }
  return new Promise(async (resolve, reject) => {

    try {
      const canvasEl = document.createElement('canvas')
      canvasEl.width = 800
      canvasEl.height = 800

      const staticCanvas = new fabric.StaticCanvas(canvasEl, {
        width: 800,
        height: 800,
        backgroundColor: '#ffffff',
      })

      // Priority: customTemplateConfig (Product Template) -> shop.template_config (Shop Template)
      const templateConfig =
        customTemplateConfig && Object.keys(customTemplateConfig).length > 0
          ? customTemplateConfig
          : shop.template_config

      if (templateConfig && Object.keys(templateConfig).length > 0) {
        staticCanvas.loadFromJSON(templateConfig, async () => {
      // Removed existing error handling for missing image; now handled above.
      try {
        await replacePlaceholders(staticCanvas, product, brand, shop, transparentProductImageUrl)
        staticCanvas.renderAll()
        const dataUrl = staticCanvas.toDataURL({ format: 'png', quality: 1 })
        staticCanvas.dispose()
        resolve(dataUrl)
      } catch (err) {
        staticCanvas.dispose()
        reject(err)
      }

        })
      } else {
        await buildFallbackLayout(staticCanvas, product, brand, shop, transparentProductImageUrl)
        if (staticCanvas.getContext()) {
          staticCanvas.renderAll()
        }
        const dataUrl = staticCanvas.toDataURL({ format: 'png', quality: 1 })
        staticCanvas.dispose()
        resolve(dataUrl)
      }
    } catch (err) {
      reject(err)
    }
  })
}

async function replacePlaceholders(
  canvas: fabric.StaticCanvas,
  product: Product,
  brand: Brand | null,
  shop: Shop,
  transparentProductImageUrl: string
) {
  if (!transparentProductImageUrl) {
    // No product image available; skip placeholder replacement.
    return
  }

  const objects = canvas.getObjects()
  const objectsToRemove: fabric.Object[] = []

  for (const obj of objects) {
    // @ts-ignore
    const pType = obj.placeholderType

    if (!pType) continue

    if (pType === 'product_image') {
      objectsToRemove.push(obj)
      try {
        const prodImg = await loadFabricImage(transparentProductImageUrl)
        const targetW = (obj.width || 400) * (obj.scaleX || 1)
        const targetH = (obj.height || 400) * (obj.scaleY || 1)
        const scale = Math.min(targetW / (prodImg.width || 1), targetH / (prodImg.height || 1)) * 0.95

        prodImg.set({
          left: (obj.left || 0) + (targetW - (prodImg.width || 1) * scale) / 2,
          top: (obj.top || 0) + (targetH - (prodImg.height || 1) * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        })

        canvas.add(prodImg)
      } catch (e) {
        console.warn('Could not render product image:', e)
      }
    } else if (pType === 'brand_logo' && brand?.logo_url) {
      objectsToRemove.push(obj)
      try {
        const brandImg = await loadFabricImage(brand.logo_url)
        const targetW = (obj.width || 120) * (obj.scaleX || 1)
        const targetH = (obj.height || 60) * (obj.scaleY || 1)
        const scale = Math.min(targetW / (brandImg.width || 1), targetH / (brandImg.height || 1))

        brandImg.set({
          left: (obj.left || 0) + (targetW - (brandImg.width || 1) * scale) / 2,
          top: (obj.top || 0) + (targetH - (brandImg.height || 1) * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        })
        canvas.add(brandImg)
      } catch (e) {
        console.warn('Could not load brand logo:', e)
      }
    } else if (pType === 'shop_logo' && shop.logo_url) {
      objectsToRemove.push(obj)
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
        })
        canvas.add(shopImg)
      } catch (e) {
        console.warn('Could not load shop logo:', e)
      }
    } else if (pType === 'product_title' && obj.type === 'textbox') {
      const tb = obj as fabric.Textbox
      tb.set({ text: product.name })
    } else if (pType === 'product_desc' && obj.type === 'textbox') {
      const tb = obj as fabric.Textbox
      tb.set({ text: product.description || '' })
    }
  }

  objectsToRemove.forEach((o) => canvas.remove(o))
}

async function buildFallbackLayout(
  canvas: fabric.StaticCanvas,
  product: Product,
  brand: Brand | null,
  shop: Shop,
  transparentProductImageUrl: string
) {
  const prodImg = await loadFabricImage(transparentProductImageUrl)
  const scale = Math.min(500 / (prodImg.width || 1), 460 / (prodImg.height || 1)) * 0.95

  prodImg.set({
    left: 150 + (500 - (prodImg.width || 1) * scale) / 2,
    top: 150 + (460 - (prodImg.height || 1) * scale) / 2,
    scaleX: scale,
    scaleY: scale,
  })
  canvas.add(prodImg)

  if (brand?.logo_url) {
    try {
      const brandImg = await loadFabricImage(brand.logo_url)
      const bScale = Math.min(140 / (brandImg.width || 1), 70 / (brandImg.height || 1))
      brandImg.set({
        left: 40,
        top: 40,
        scaleX: bScale,
        scaleY: bScale,
      })
      canvas.add(brandImg)
    } catch (e) {
      console.warn(e)
    }
  }

  if (shop.logo_url) {
    try {
      const shopImg = await loadFabricImage(shop.logo_url)
      const sScale = Math.min(140 / (shopImg.width || 1), 70 / (shopImg.height || 1))
      shopImg.set({
        left: 620,
        top: 40,
        scaleX: sScale,
        scaleY: sScale,
      })
      canvas.add(shopImg)
    } catch (e) {
      console.warn(e)
    }
  }

  const title = new fabric.Textbox(product.name, {
    left: 40,
    top: 640,
    width: 720,
    fontSize: 32,
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    fill: '#0f172a',
    textAlign: 'center',
  })
  canvas.add(title)
}
