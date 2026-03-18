import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
  error: string | null
}

// Cart item returned from the backend
export interface CartItem {
  id: string
  cartItemId: string // Unique ID for this specific cart entry (id + size)
  name: string
  price: number
  image: string
  quantity: number
  size?: 'Full' | 'Half'
}

// Request payload for adding item to cart (minimal data for security)
export interface AddToCartRequest {
  menuItemId: string  // The menu item ID
  quantity: number
  size: 'Full' | 'Half'
}

// Request payload for updating cart item
export interface UpdateCartItemRequest {
  id: string  // cartItemId
  quantity: number
}

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as any
      const token = state.auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    }
  }),
  tagTypes: ['Cart'],
  endpoints: (builder) => ({
    getCart: builder.query<CartItem[], void>({
      query: () => 'cart',
      providesTags: ['Cart'],
      transformResponse: (response: ApiResponse<CartItem[]>) => response.data,
    }),
    addToCart: builder.mutation<CartItem, AddToCartRequest>({
      query: (item) => ({
        url: 'cart/items',
        method: 'POST',
        body: item,
      }),
      transformResponse: (response: ApiResponse<CartItem>) => response.data,
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<CartItem, UpdateCartItemRequest>({
      query: ({ id, quantity }) => ({
        url: `cart/items/${id}`,
        method: 'PATCH',
        body: { quantity },
      }),
      transformResponse: (response: ApiResponse<CartItem>) => response.data,
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `cart/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<void, void>({
      query: () => ({
        url: 'cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    syncCart: builder.mutation<CartItem[], CartItem[]>({
        query: (items) => ({
            url: 'cart/sync',
            method: 'POST',
            body: { items }
        }),
        transformResponse: (response: ApiResponse<CartItem[]>) => response.data,
        invalidatesTags: ['Cart']
    })
  }),
})

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useSyncCartMutation
} = cartApi
