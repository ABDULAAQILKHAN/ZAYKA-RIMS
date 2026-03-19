// Client-side Supabase client
export { createClient, supabaseClient } from './client'

// Server-side Supabase client (use in Server Components / Route Handlers)
export { createClient as createServerClient } from './server'

// Middleware helper
export { createMiddlewareClient } from './middleware'

// Storage helpers
export {
  uploadImage,
  deleteImage,
  updateImage,
  getImagePathFromUrl,
  isSupabaseImage,
  type ImageUploadResult,
  type ImageDeleteResult,
} from './storage'
