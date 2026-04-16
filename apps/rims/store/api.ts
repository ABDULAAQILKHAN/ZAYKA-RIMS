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
  activeOrderCount: number
}

export type MenuRecord = {
  id: string
  name: string
  price: number
  isAvailable: boolean
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
  menuItemId: string
  quantity: number
  size?: "Full" | "Half"
}

export type OrderRecord = {
  id: string
  orderType: OrderType
  tableId?: string
  tableNumber?: number
  sessionId?: string
  status: OrderStatus
  items: Array<{
    id: string
    menuItemId: string
    menuItemName: string
    quantity: number
    unitPrice: number
    lineTotal: number
    size?: "Full" | "Half"
  }>
  subtotal: number
  gst: number
  total: number
  createdAt: string
}

export type TableSession = {
  id: string
  tableId: string
  tableNumber: number
  status: "open" | "closed"
  orderIds: string[]
  subtotal: number
  gst: number
  total: number
  createdAt: string
  closedAt?: string
}

export type InvoiceRecord = {
  id: string
  orderId?: string
  sessionId?: string
  orderType: OrderType
  tableNumber?: number
  items: OrderRecord["items"]
  subtotal: number
  gst: number
  total: number
  createdAt: string
}

export type InsightsPeriod = "week" | "month"

export type InsightsRecord = {
  period: InsightsPeriod
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  orderTypeBreakdown: {
    table: number
    takeaway: number
    delivery: number
  }
  topItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  tableUtilization: Array<{
    tableNumber: number
    sessionCount: number
    totalRevenue: number
  }>
  dailyRevenue: Array<{
    date: string
    revenue: number
    orderCount: number
  }>
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }: any) => {
    const state = getState() as { auth?: { token?: string | null } }
    const token = state?.auth?.token
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  }
})

const customBaseQuery = async (args: any, api: any, extraOptions: any) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.data && typeof result.data === 'object' && 'data' in result.data) {
    return { ...result, data: (result.data as any).data }
  }
  return result
}

export const rimsApi = createApi({
  reducerPath: "rimsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Auth", "Table", "Menu", "Order", "History", "Invoice", "Session", "Insights"],
  endpoints: (builder) => ({
    // ── Tables ────────────────────────────────

    getTables: builder.query<TableRecord[], { status?: "available" | "occupied" } | void>({
      query: (arg) => {
        if (arg && arg.status) return `tables?status=${arg.status}`;
        return 'tables';
      },
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
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `sessions/${sessionId}/close`,
        method: 'POST',
      }),
      invalidatesTags: ["Session", "Invoice", "Table", "Order", "History", "Insights"],
    }),

    // ── Orders ────────────────────────────────

    createOrder: builder.mutation<
      OrderRecord,
      {
        orderType: OrderType
        tableId?: string
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
        tableId?: string
        orderType?: OrderType | "all"
      }
    >({
      query: (filters) => {
        const params = new URLSearchParams()
        if (filters.date) params.append('date', filters.date)
        if (filters.tableId) params.append('tableId', filters.tableId)
        if (filters.orderType && filters.orderType !== 'all') params.append('orderType', filters.orderType)
        return `orders/history?${params.toString()}`
      },
      providesTags: ["History"],
    }),

    // ── Takeaway ──────────────────────────────

    createTakeawayOrder: builder.mutation<
      { order: OrderRecord; invoice: InvoiceRecord },
      { items: CreateOrderItemInput[]; orderType: OrderType }
    >({
      query: (payload) => ({
        url: 'orders/takeaway',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ["Order", "History", "Invoice", "Insights"],
    }),

    // ── Invoices ──────────────────────────────

    generateInvoice: builder.mutation<InvoiceRecord, { orderId?: string; sessionId?: string }>({
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

    getInvoices: builder.query<InvoiceRecord[], void>({
      query: () => 'invoices',
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
  useGetInvoicesQuery,
  useGetInsightsQuery,
} = rimsApi
