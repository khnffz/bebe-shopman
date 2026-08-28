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
