import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const BUCKET_NAME = 'landingPage'
const BUCKET_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL as string

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

/**
 * Upload an image to Supabase storage
 * @param file - The image file to upload
 * @param folder - Folder within the bucket (e.g., 'special-offers', 'todays-specials')
 * @param fileName - Optional custom filename, if not provided, will generate unique name
 */
export async function uploadImage(
  file: File, 
  folder: string, 
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        url: '',
        path: '',
        success: false,
        error: 'Please select a valid image file'
      }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        url: '',
        path: '',
        success: false,
        error: 'Image size must be less than 5MB'
      }
    }

    // Generate unique filename if not provided
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop()
    const finalFileName = fileName || `${timestamp}-${randomStr}.${fileExt}`
    
    // Create the full path
    const filePath = `${folder}/${finalFileName}`

    console.log('Uploading image:', { filePath, fileSize: file.size, fileType: file.type })

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return {
        url: '',
        path: '',
        success: false,
        error: error.message
      }
    }

    // Construct the public URL
    const publicUrl = `${BUCKET_URL}${BUCKET_NAME}/${filePath}`

    console.log('Image uploaded successfully:', { path: data.path, publicUrl })

    return {
      url: publicUrl,
      path: data.path,
      success: true
    }

  } catch (error) {
    console.error('Image upload error:', error)
    return {
      url: '',
      path: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Delete an image from Supabase storage
 * @param imagePath - The path of the image in storage (not the full URL)
 */
export async function deleteImage(imagePath: string): Promise<ImageDeleteResult> {
  try {
    console.log('Deleting image:', imagePath)

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath])

    if (error) {
      console.error('Supabase delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('Image deleted successfully:', imagePath)

    return {
      success: true
    }

  } catch (error) {
    console.error('Image delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Update an image (delete old, upload new)
 * @param file - The new image file to upload
 * @param folder - Folder within the bucket
 * @param oldImagePath - Path of the old image to delete (optional)
 * @param fileName - Optional custom filename
 */
export async function updateImage(
  file: File,
  folder: string,
  oldImagePath?: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    // Delete old image if provided
    if (oldImagePath) {
      const deleteResult = await deleteImage(oldImagePath)
      if (!deleteResult.success) {
        console.warn('Failed to delete old image:', deleteResult.error)
        // Continue with upload even if delete fails
      }
    }

    // Upload new image
    return await uploadImage(file, folder, fileName)

  } catch (error) {
    console.error('Image update error:', error)
    return {
      url: '',
      path: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Extract the storage path from a full image URL
 * @param imageUrl - The full public URL of the image
 * @returns The storage path or null if URL is invalid
 */
export function getImagePathFromUrl(imageUrl: string): string | null {
  try {
    console.log('Extracting path from URL:', imageUrl)
    
    if (!imageUrl) {
      console.warn('getImagePathFromUrl: Empty image URL')
      return null
    }

    // Check if URL contains the bucket name
    if (!imageUrl.includes(BUCKET_NAME)) {
      console.warn('getImagePathFromUrl: URL does not contain bucket name:', BUCKET_NAME)
      return null
    }

    // Extract path after bucket name
    const bucketIndex = imageUrl.indexOf(`${BUCKET_NAME}/`)
    if (bucketIndex === -1) {
      console.warn('getImagePathFromUrl: Could not find bucket name with slash in URL')
      return null
    }

    const extractedPath = imageUrl.substring(bucketIndex + `${BUCKET_NAME}/`.length)
    console.log('Extracted path:', extractedPath)
    
    return extractedPath
  } catch (error) {
    console.error('Error extracting image path:', error)
    return null
  }
}

/**
 * Validate if an image URL belongs to our Supabase bucket
 * @param imageUrl - The image URL to validate
 * @returns True if URL is from our bucket, false otherwise
 */
export function isSupabaseImage(imageUrl: string): boolean {
  return imageUrl.includes(BUCKET_URL) && imageUrl.includes(BUCKET_NAME)
}
