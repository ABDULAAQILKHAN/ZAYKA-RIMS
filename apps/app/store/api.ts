import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type ApiError = {
  status: number | string
  data: { message: string }
}

export type AuthUser = {
  id: string
  email: string
}

export type AuthRole = 'admin' | 'manager'

export type DiningTable = {
  id: string
  tableNumber: number
  seats?: number
  tableNearWindow?: boolean
  status: 'available' | 'occupied' | 'reserved'
  activeOrderCount: number
}

export type OrderType = 'table' | 'delivery'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export type OrderItemInput = {
  menu_item_id: string
  quantity: number
}

export type OrderRecord = {
  id: string
  order_type: OrderType
  table_id?: string
  status: OrderStatus
  items: Array<{
    id: string
    menu_item_id: string
    menu_item_name: string
    quantity: number
    unit_price: number
    line_total: number
  }>
  subtotal: number
  gst: number
  total: number
  created_at: string
}

export type InvoiceRecord = {
  id: string
  order_id: string
  items: OrderRecord['items']
  subtotal: number
  gst: number
  total: number
  created_at: string
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const rimsContractApi = createApi({
  reducerPath: 'rimsContractApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }: any) => {
      const state = getState() as { auth?: { token?: string | null } }
      const token = state?.auth?.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ['Auth', 'Table', 'Order', 'Invoice'],
  endpoints: (builder) => ({
    getTables: builder.query<DiningTable[], void>({
      query: () => 'tables',
      transformResponse: (response: { data: DiningTable[] } | DiningTable[]) => {
        return 'data' in response ? response.data : response;
      },
      providesTags: ['Table'],
    }),

    createTable: builder.mutation<DiningTable, { tableNumber: number; seats?: number; tableNearWindow?: boolean }>({
      query: (payload) => ({
        url: 'tables',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Table'],
    }),

    updateTable: builder.mutation<DiningTable, { id: string; status: 'available' | 'occupied' | 'reserved' }>({
      query: ({ id, ...payload }) => ({
        url: `tables/${id}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Table'],
    }),

    deleteTable: builder.mutation<{ success: true; id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Table'],
    }),
  }),
})

export const {
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} = rimsContractApi
