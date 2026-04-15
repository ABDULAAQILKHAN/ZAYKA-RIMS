import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

export type ApiError = {
  status: number | string
  data: { message: string }
}

export type AuthUser = {
  id: string
  email: string
}

export type AuthRole = 'admin' | 'manager'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: AuthUser
  role: AuthRole
  token: string
}

export type DiningTable = {
  id: string
  table_number: string
  capacity?: number
  status: 'available' | 'occupied'
  active_order_count: number
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

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

const memoryDb: {
  tables: DiningTable[]
  orders: OrderRecord[]
  invoices: InvoiceRecord[]
} = {
  tables: [
    { id: 't-1', table_number: 'T1', capacity: 4, status: 'occupied', active_order_count: 1 },
    { id: 't-2', table_number: 'T2', capacity: 2, status: 'available', active_order_count: 0 },
    { id: 't-3', table_number: 'T3', capacity: 6, status: 'occupied', active_order_count: 2 },
  ],
  orders: [],
  invoices: [],
}

function buildError(message: string): ApiError {
  return {
    status: 'CUSTOM_ERROR',
    data: { message },
  }
}

export const rimsContractApi = createApi({
  reducerPath: 'rimsContractApi',
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ['Auth', 'Table', 'Order', 'Invoice'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      async queryFn(payload) {
        await delay()

        if (!payload.email || !payload.password) {
          return { error: buildError('Email and password are required') }
        }

        return {
          data: {
            user: { id: 'admin-1', email: payload.email.toLowerCase() },
            role: payload.email.includes('manager') ? 'manager' : 'admin',
            token: `mock-token-${Date.now()}`,
          },
        }
      },
      invalidatesTags: ['Auth'],
    }),

    getTables: builder.query<DiningTable[], void>({
      async queryFn() {
        await delay()
        return { data: [...memoryDb.tables].sort((a, b) => a.table_number.localeCompare(b.table_number)) }
      },
      providesTags: ['Table'],
    }),

    createTable: builder.mutation<DiningTable, Pick<DiningTable, 'table_number' | 'capacity'>>({
      async queryFn(payload) {
        await delay()

        const tableNumber = payload.table_number.trim()
        if (!tableNumber) {
          return { error: buildError('table_number is required') }
        }

        const exists = memoryDb.tables.some(
          (table) => table.table_number.toLowerCase() === tableNumber.toLowerCase(),
        )

        if (exists) {
          return { error: buildError('table_number must be unique') }
        }

        const next: DiningTable = {
          id: `t-${Math.random().toString(36).slice(2, 8)}`,
          table_number: tableNumber,
          capacity: payload.capacity,
          status: 'available',
          active_order_count: 0,
        }

        memoryDb.tables.push(next)
        return { data: next }
      },
      invalidatesTags: ['Table'],
    }),

    updateTable: builder.mutation<DiningTable, { id: string; table_number: string; capacity?: number }>({
      async queryFn(payload) {
        await delay()

        const index = memoryDb.tables.findIndex((table) => table.id === payload.id)
        if (index < 0) {
          return { error: buildError('Table not found') }
        }

        const tableNumber = payload.table_number.trim()
        if (!tableNumber) {
          return { error: buildError('table_number is required') }
        }

        const duplicate = memoryDb.tables.some(
          (table) =>
            table.id !== payload.id &&
            table.table_number.toLowerCase() === tableNumber.toLowerCase(),
        )

        if (duplicate) {
          return { error: buildError('table_number must be unique') }
        }

        const current = memoryDb.tables[index]
        const updated: DiningTable = {
          ...current,
          table_number: tableNumber,
          capacity: payload.capacity,
        }

        memoryDb.tables[index] = updated
        return { data: updated }
      },
      invalidatesTags: ['Table'],
    }),

    deleteTable: builder.mutation<{ success: true; id: string }, { id: string }>({
      async queryFn(payload) {
        await delay()
        memoryDb.tables = memoryDb.tables.filter((table) => table.id !== payload.id)
        return { data: { success: true, id: payload.id } }
      },
      invalidatesTags: ['Table'],
    }),
  }),
})

export const {
  useLoginMutation,
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} = rimsContractApi
