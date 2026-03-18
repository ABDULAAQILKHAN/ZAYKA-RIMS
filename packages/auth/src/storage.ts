import { createClient as createBrowserClient } from '@supabase/ssr'

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

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const uniqueName = fileName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const path = `${folder}/${uniqueName}`

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      return { url: '', path: '', success: false, error: error.message }
    }

    const bucketUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL as string
    const url = `${bucketUrl}/${BUCKET_NAME}/${path}`

    return { url, path, success: true }
  } catch {
    return { url: '', path: '', success: false, error: 'Upload failed' }
  }
}
