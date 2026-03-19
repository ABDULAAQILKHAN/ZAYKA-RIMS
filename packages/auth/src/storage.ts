import { createBrowserClient } from '@supabase/ssr'

const BUCKET_NAME = 'landingPage'

export interface ImageUploadResult {
  url: string
  path: string
  success: boolean
  error?: string
}

export interface ImageDeleteResult {
  success: boolean
  error?: string
}

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function uploadImage(
  file: File,
  folder: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    if (!file.type.startsWith('image/')) {
      return { url: '', path: '', success: false, error: 'Please select a valid image file' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { url: '', path: '', success: false, error: 'Image size must be less than 5MB' }
    }

    const supabase = getSupabaseClient()

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop()
    const finalFileName = fileName || `${timestamp}-${randomStr}.${fileExt}`
    const path = `${folder}/${finalFileName}`

    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      return { url: '', path: '', success: false, error: error.message }
    }

    const bucketUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL as string
    const url = `${bucketUrl}${BUCKET_NAME}/${path}`

    return { url, path: data.path, success: true }
  } catch {
    return { url: '', path: '', success: false, error: 'Upload failed' }
  }
}

export async function deleteImage(imagePath: string): Promise<ImageDeleteResult> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Delete failed' }
  }
}

export async function updateImage(
  file: File,
  folder: string,
  oldImagePath?: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    if (oldImagePath) {
      await deleteImage(oldImagePath)
    }

    return await uploadImage(file, folder, fileName)
  } catch {
    return { url: '', path: '', success: false, error: 'Update failed' }
  }
}

export function getImagePathFromUrl(imageUrl: string): string | null {
  try {
    if (!imageUrl) return null
    if (!imageUrl.includes(BUCKET_NAME)) return null

    const bucketIndex = imageUrl.indexOf(`${BUCKET_NAME}/`)
    if (bucketIndex === -1) return null

    return imageUrl.substring(bucketIndex + `${BUCKET_NAME}/`.length)
  } catch {
    return null
  }
}

export function isSupabaseImage(imageUrl: string): boolean {
  const bucketUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL as string
  return imageUrl.includes(bucketUrl) && imageUrl.includes(BUCKET_NAME)
}
