import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export type ApiError = {
  status: number | string
  data: { message: string }
}

export type AuthRole = "admin" | "manager"

export type TableRecord = {
  id: string
  tableNumber: number
  capacity?: number
  status: "available" | "occupied"
  active_order_count: number
}

export type MenuRecord = {
  id: string
  name: string
  price: number
  is_available: boolean
}

export type OrderType = "table" | "delivery" | "takeaway"

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"

export type CreateOrderItemInput = {
  menu_item_id: string
  quantity: number
}

export type OrderRecord = {
  id: string
  order_type: OrderType
  table_id?: string
  tableNumber?: number
  session_id?: string
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

export type TableSession = {
  id: string
  table_id: string
  tableNumber: number
  status: "open" | "closed"
  order_ids: string[]
  subtotal: number
  gst: number
  total: number
  created_at: string
  closed_at?: string
}

export type InvoiceRecord = {
  id: string
  order_id?: string
  session_id?: string
  order_type: OrderType
  tableNumber?: number
  items: OrderRecord["items"]
  subtotal: number
  gst: number
  total: number
  created_at: string
}

export type InsightsPeriod = "week" | "month"

export type InsightsRecord = {
  period: InsightsPeriod
  total_revenue: number
  total_orders: number
  average_order_value: number
  order_type_breakdown: {
    table: number
    takeaway: number
    delivery: number
  }
  top_items: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  table_utilization: Array<{
    tableNumber: number
    session_count: number
    total_revenue: number
  }>
  daily_revenue: Array<{
    date: string
    revenue: number
    order_count: number
  }>
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const rimsApi = createApi({
  reducerPath: "rimsApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }: any) => {
      const state = getState() as { auth?: { token?: string | null } }
      const token = state?.auth?.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ["Auth", "Table", "Menu", "Order", "History", "Invoice", "Session", "Insights"],
  endpoints: (builder) => ({
    // ── Tables ────────────────────────────────

    getTables: builder.query<TableRecord[], void>({
      query: () => 'tables',
      providesTags: ["Table"],
    }),

    createTable: builder.mutation<TableRecord, { tableNumber: number }>({
      query: (payload) => ({
        url: 'tables',
        method: 'POST',
        body: { tableNumber: payload.tableNumber },
      }),
      invalidatesTags: ["Table"],
    }),

    updateTable: builder.mutation<
      TableRecord,
      { id: string; tableNumber: number; capacity?: number }
    >({
      query: ({ id, ...payload }) => ({
        url: `tables/${id}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ["Table"],
    }),

    deleteTable: builder.mutation<{ success: boolean; id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["Table"],
    }),

    // ── Menu ──────────────────────────────────

    getMenu: builder.query<MenuRecord[], void>({
      query: () => 'menu',
      providesTags: ["Menu"],
    }),

    // ── Sessions ──────────────────────────────

    getTableSessions: builder.query<(TableSession & { orders: OrderRecord[] })[], void>({
      query: () => 'sessions',
      providesTags: ["Session"],
    }),

    getTableSessionById: builder.query<
      TableSession & { orders: OrderRecord[] },
      { id: string }
    >({
      query: ({ id }) => `sessions/${id}`,
      providesTags: ["Session"],
    }),

    closeTableSession: builder.mutation<
      InvoiceRecord,
      { session_id: string }
    >({
      query: ({ session_id }) => ({
        url: `sessions/${session_id}/close`,
        method: 'POST',
      }),
      invalidatesTags: ["Session", "Invoice", "Table", "Order", "History", "Insights"],
    }),

    // ── Orders ────────────────────────────────

    createOrder: builder.mutation<
      OrderRecord,
      {
        order_type: OrderType
        table_id?: string
        items: CreateOrderItemInput[]
      }
    >({
      query: (payload) => ({
        url: 'orders',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ["Order", "History", "Table", "Session", "Insights"],
    }),

    getOrders: builder.query<OrderRecord[], void>({
      query: () => 'orders',
      providesTags: ["Order"],
    }),

    updateOrderStatus: builder.mutation<OrderRecord, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ["Order", "History", "Table", "Session", "Insights"],
    }),

    getOrderHistory: builder.query<
      OrderRecord[],
      {
        date?: string
        table_id?: string
        order_type?: OrderType | "all"
      }
    >({
      query: (filters) => {
        const params = new URLSearchParams()
        if (filters.date) params.append('date', filters.date)
        if (filters.table_id) params.append('table_id', filters.table_id)
        if (filters.order_type && filters.order_type !== 'all') params.append('order_type', filters.order_type)
        return `orders/history?${params.toString()}`
      },
      providesTags: ["History"],
    }),

    // ── Takeaway ──────────────────────────────

    createTakeawayOrder: builder.mutation<
      { order: OrderRecord; invoice: InvoiceRecord },
      { items: CreateOrderItemInput[] }
    >({
      query: (payload) => ({
        url: 'takeaway/orders',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ["Order", "History", "Invoice", "Insights"],
    }),

    // ── Invoices ──────────────────────────────

    generateInvoice: builder.mutation<InvoiceRecord, { order_id?: string; session_id?: string }>({
      query: (payload) => ({
        url: 'invoices',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ["Invoice"],
    }),

    getInvoice: builder.query<InvoiceRecord, { id: string }>({
      query: ({ id }) => `invoices/${id}`,
      providesTags: ["Invoice"],
    }),

    // ── Insights ──────────────────────────────

    getInsights: builder.query<InsightsRecord, { period: InsightsPeriod }>({
      query: (payload) => `insights?period=${payload.period}`,
      providesTags: ["Insights"],
    }),
  }),
})

export const {
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useGetMenuQuery,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetOrderHistoryQuery,
  useGetTableSessionsQuery,
  useGetTableSessionByIdQuery,
  useCloseTableSessionMutation,
  useCreateTakeawayOrderMutation,
  useGenerateInvoiceMutation,
  useGetInvoiceQuery,
  useGetInsightsQuery,
} = rimsApi
