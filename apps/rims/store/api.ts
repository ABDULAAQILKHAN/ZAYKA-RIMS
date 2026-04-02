import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  Ingredient,
  MenuItem,
  Recipe,
  RimsOrder,
  RimsOrderItem,
  Invoice,
} from '@zayka/types'

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth?: { token?: string | null } }
      const token = state?.auth?.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Ingredients', 'Menu', 'Recipes', 'Orders', 'Invoices'],
  endpoints: (builder) => ({
    // ─── Ingredients ──────────────────────────────────
    getIngredients: builder.query<Ingredient[], void>({
      query: () => 'ingredients',
      providesTags: ['Ingredients'],
    }),
    createIngredient: builder.mutation<Ingredient, Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: 'ingredients', method: 'POST', body }),
      invalidatesTags: ['Ingredients'],
    }),
    updateIngredient: builder.mutation<Ingredient, { id: string; data: Partial<Ingredient> }>({
      query: ({ id, data }) => ({ url: `ingredients/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Ingredients'],
    }),

    // ─── Menu ─────────────────────────────────────────
    getMenuItems: builder.query<MenuItem[], void>({
      query: () => 'menu',
      providesTags: ['Menu'],
    }),

    // ─── Recipes (Menu ↔ Ingredient Mapping) ─────────
    getRecipes: builder.query<Recipe[], void>({
      query: () => 'recipes',
      providesTags: ['Recipes'],
    }),
    getRecipesByMenuItem: builder.query<Recipe[], string>({
      query: (menuItemId) => `recipes?menuItemId=${menuItemId}`,
      providesTags: ['Recipes'],
    }),
    createRecipe: builder.mutation<Recipe, Omit<Recipe, 'id' | 'ingredient' | 'menuItem'>>({
      query: (body) => ({ url: 'recipes', method: 'POST', body }),
      invalidatesTags: ['Recipes', 'Menu'],
    }),
    deleteRecipe: builder.mutation<void, string>({
      query: (id) => ({ url: `recipes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Recipes', 'Menu'],
    }),

    // ─── Orders ───────────────────────────────────────
    getOrders: builder.query<RimsOrder[], void>({
      query: () => 'orders',
      providesTags: ['Orders'],
    }),
    createOrder: builder.mutation<RimsOrder, { items: Omit<RimsOrderItem, 'menuItemName'>[] }>({
      query: (body) => ({ url: 'orders', method: 'POST', body }),
      invalidatesTags: ['Orders', 'Ingredients', 'Menu'],
    }),
    updateOrderStatus: builder.mutation<RimsOrder, { id: string; status: RimsOrder['status'] }>({
      query: ({ id, status }) => ({ url: `orders/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Orders'],
    }),

    // ─── Invoices ─────────────────────────────────────
    getInvoices: builder.query<Invoice[], void>({
      query: () => 'invoices',
      providesTags: ['Invoices'],
    }),
    createInvoice: builder.mutation<Invoice, { orderId: string; gstPercent: number }>({
      query: (body) => ({ url: 'invoices', method: 'POST', body }),
      invalidatesTags: ['Invoices'],
    }),
  }),
})

export const {
  // Ingredients
  useGetIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  // Menu
  useGetMenuItemsQuery,
  // Recipes
  useGetRecipesQuery,
  useGetRecipesByMenuItemQuery,
  useCreateRecipeMutation,
  useDeleteRecipeMutation,
  // Orders
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  // Invoices
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
} = api
