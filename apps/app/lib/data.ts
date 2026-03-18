// This file previously contained demo data for menu items and categories.
// All menu data is now managed through the RTK Query API in /store/menuApi.ts
// and stored in the database via the backend API endpoints.

// Legacy interfaces kept for backward compatibility if needed
export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVeg: boolean
  isSpicy?: boolean
}

export interface Category {
  id: string
  name: string
  count: number
}

// All demo data has been removed and replaced with RTK Query API calls
// Menu items and categories are now fetched from the backend database

// Placeholder functions for backward compatibility (return empty arrays)
export function getAllCategories(): Category[] {
  console.warn('getAllCategories is deprecated. Use useGetActiveMenuCategoriesQuery from @/store/menuApi instead.')
  return []
}

export function getMenuItems(categoryId = "all"): MenuItem[] {
  console.warn('getMenuItems is deprecated. Use useGetMenuItemsQuery or useGetAvailableMenuItemsQuery from @/store/menuApi instead.')
  return []
}

export function getMenuItem(id: string): MenuItem | undefined {
  console.warn('getMenuItem is deprecated. Use useGetMenuItemByIdQuery from @/store/menuApi instead.')
  return undefined
}
