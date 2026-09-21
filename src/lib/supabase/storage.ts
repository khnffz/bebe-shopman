import { createClient } from '@/lib/supabase/client'

export async function uploadAsset(
  file: File,
  folder: 'brands' | 'shops' | 'products'
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  // Get authenticated user ID to organize files
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { url: null, error: 'User is not authenticated' }
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('assets').getPublicUrl(fileName)

  return { url: publicUrl, error: null }
}

export function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } {
  const parts = dataUrl.split(';base64,')
  const contentType = parts[0].split(':')[1] || 'image/png'
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return { blob: new Blob([uInt8Array], { type: contentType }), contentType }
}

export async function uploadDataUrlAsset(
  dataUrl: string,
  folder: 'brands' | 'shops' | 'products',
  fileNamePrefix: string = 'generated'
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { url: null, error: 'User is not authenticated' }
  }

  const { blob, contentType } = dataUrlToBlob(dataUrl)
  const fileExt = contentType.split('/')[1] || 'png'
  const fileName = `${user.id}/${folder}/${fileNamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(fileName, blob, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('assets').getPublicUrl(fileName)

  return { url: publicUrl, error: null }
}
