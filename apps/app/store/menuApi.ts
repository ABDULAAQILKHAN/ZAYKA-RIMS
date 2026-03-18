import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface MenuItem {
  id: string
  name: string
  description: string
  fullPrice: number
  halfPrice?: number
  image: string
  categoryId: string
  category?: string
  isVeg: boolean
  isSpicy: boolean
  isAvailable: boolean
  ingredients?: string[]
  allergens?: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  preparationTime?: number | string
  createdAt?: string
  updatedAt?: string
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface CreateMenuItemInput extends Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'> { }
interface UpdateMenuItemInput extends Partial<Omit<MenuItem, 'id'>> { id: string }

interface CreateMenuCategoryInput extends Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'> { }
interface UpdateMenuCategoryInput extends Partial<Omit<MenuCategory, 'id'>> { id: string }

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const menuApi = createApi({
  reducerPath: 'menuApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers: Headers, { getState }: any) => {
      const state = getState() as { auth?: { token?: string | null } }
      const token = state?.auth?.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ['MenuItem', 'MenuCategory'],
  endpoints: (builder) => ({
    // Menu Items
    getMenuItems: builder.query<MenuItem[], { category?: string; available?: boolean }>({
      query: ({ category, available } = {}) => {
        const params = new URLSearchParams()
        if (category) params.append('category', category)
        if (available !== undefined) params.append('available', available.toString())
        return `menu-items?${params.toString()}`
      },
      transformResponse: (response: any) => {
        console.log('getMenuItems raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.menuItems)) {
          return response.menuItems
        }
        console.warn('Unexpected response structure for menu items:', response)
        return []
      },
      providesTags: (result) => {
        if (!result || !Array.isArray(result)) {
          console.log('getMenuItems result is not an array:', result)
          return [{ type: 'MenuItem', id: 'LIST' }]
        }
        return [
          ...result.map(r => ({ type: 'MenuItem' as const, id: r.id })),
          { type: 'MenuItem', id: 'LIST' }
        ]
      }
    }),
    getAvailableMenuItems: builder.query<MenuItem[], { category?: string }>({
      query: ({ category } = {}) => {
        const params = new URLSearchParams()
        params.append('available', 'true')
        if (category) params.append('category', category)
        return `menu-items?${params.toString()}`
      },
      transformResponse: (response: any) => {
        console.log('getAvailableMenuItems raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.menuItems)) {
          return response.menuItems
        }
        console.warn('Unexpected response structure for available menu items:', response)
        return []
      },
      providesTags: [{ type: 'MenuItem', id: 'AVAILABLE' }]
    }),
    getMenuItemById: builder.query<MenuItem, string>({
      query: (id) => `menu-items/${id}`,
      transformResponse: (response: any) => {
        console.log('getMenuItemById raw response:', response)
        // Handle different response structures
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // If response has data, item, or menuItem property, use that
          if (response.data) return response.data
          if (response.item) return response.item
          if (response.menuItem) return response.menuItem
          // Otherwise assume the response itself is the item
          return response
        }
        return response
      },
      providesTags: (result, error, id) => [{ type: 'MenuItem', id }]
    }),
    getMenuItemsByCategory: builder.query<MenuItem[], string>({
      query: (category) => `menu-items?category=${category}`,
      transformResponse: (response: any) => {
        console.log('getMenuItemsByCategory raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.menuItems)) {
          return response.menuItems
        }
        console.warn('Unexpected response structure for menu items by category:', response)
        return []
      },
      providesTags: (result, error, category) => [{ type: 'MenuItem', id: `CATEGORY_${category}` }]
    }),
    createMenuItem: builder.mutation<MenuItem, CreateMenuItemInput>({
      query: (body) => ({ url: 'menu-items', method: 'POST', body }),
      invalidatesTags: (result, error, arg) => [
        { type: 'MenuItem', id: 'LIST' },
        { type: 'MenuItem', id: 'AVAILABLE' },
        { type: 'MenuItem' as const, id: `CATEGORY_${arg.categoryId}` }
      ]
    }),
    updateMenuItem: builder.mutation<MenuItem, UpdateMenuItemInput>({
      query: ({ id, ...patch }) => ({ url: `menu-items/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: (result: MenuItem | undefined, error: unknown, arg: UpdateMenuItemInput) => [
        { type: 'MenuItem', id: arg.id },
        { type: 'MenuItem', id: 'LIST' },
        { type: 'MenuItem', id: 'AVAILABLE' },
        ...(arg.categoryId ? [{ type: 'MenuItem' as const, id: `CATEGORY_${arg.categoryId}` }] : [])
      ]
    }),
    deleteMenuItem: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({ url: `menu-items/${id}`, method: 'DELETE' }),
      invalidatesTags: (result: { success: boolean; id: string } | undefined, error: unknown, id: string) => [
        { type: 'MenuItem', id },
        { type: 'MenuItem', id: 'LIST' },
        { type: 'MenuItem', id: 'AVAILABLE' }
      ]
    }),
    toggleMenuItemAvailability: builder.mutation<MenuItem, { id: string; isAvailable: boolean }>({
      query: ({ id, isAvailable }) => ({
        url: `menu-items/${id}/availability`,
        method: 'PATCH',
        body: { isAvailable }
      }),
      invalidatesTags: (result: MenuItem | undefined, error: unknown, arg: { id: string; isAvailable: boolean }) => [
        { type: 'MenuItem', id: arg.id },
        { type: 'MenuItem', id: 'LIST' },
        { type: 'MenuItem', id: 'AVAILABLE' }
      ]
    }),


    // Menu Categories
    getMenuCategories: builder.query<MenuCategory[], { active?: boolean } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams()
        if (params && typeof params === 'object' && params.active !== undefined) {
          queryParams.append('active', params.active.toString())
        }
        return `menu-categories?${queryParams.toString()}`
      },
      transformResponse: (response: any) => {
        console.log('getMenuCategories raw response:', response)
        if (Array.isArray(response)) return response
        if (response && Array.isArray(response.data)) return response.data
        return []
      },
      providesTags: (result) => {
        if (!result || !Array.isArray(result)) {
          return [{ type: 'MenuCategory', id: 'LIST' }]
        }
        return [
          ...result.map(r => ({ type: 'MenuCategory' as const, id: r.id })),
          { type: 'MenuCategory', id: 'LIST' }
        ]
      }
    }),
    getActiveMenuCategories: builder.query<MenuCategory[], void>({
      query: () => 'menu-categories?active=true',
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response
        if (response && Array.isArray(response.data)) return response.data
        return []
      },
      providesTags: [{ type: 'MenuCategory', id: 'ACTIVE' }]
    }),
    getMenuCategoryById: builder.query<MenuCategory, string>({
      query: (id) => `menu-categories/${id}`,
      transformResponse: (response: any) => {
        if (response && response.data) return response.data
        return response
      },
      providesTags: (result, error, id) => [{ type: 'MenuCategory', id }]
    }),
    createMenuCategory: builder.mutation<MenuCategory, CreateMenuCategoryInput>({
      query: (body) => ({
        url: 'menu-categories',
        method: 'POST',
        body
      }),
      invalidatesTags: [
        { type: 'MenuCategory', id: 'LIST' },
        { type: 'MenuCategory', id: 'ACTIVE' }
      ]
    }),
    updateMenuCategory: builder.mutation<MenuCategory, UpdateMenuCategoryInput>({
      query: ({ id, ...patch }) => ({
        url: `menu-categories/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'MenuCategory', id: arg.id },
        { type: 'MenuCategory', id: 'LIST' },
        { type: 'MenuCategory', id: 'ACTIVE' }
      ]
    }),
    deleteMenuCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `menu-categories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'MenuCategory', id },
        { type: 'MenuCategory', id: 'LIST' },
        { type: 'MenuCategory', id: 'ACTIVE' }
      ]
    })
  })
})

export const {
  // Menu Items
  useGetMenuItemsQuery,
  useGetAvailableMenuItemsQuery,
  useGetMenuItemByIdQuery,
  useGetMenuItemsByCategoryQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailabilityMutation,

  // Menu Categories
  useGetMenuCategoriesQuery,
  useGetActiveMenuCategoriesQuery,
  useGetMenuCategoryByIdQuery,
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation
} = menuApi
