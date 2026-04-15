import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"

export type ApiError = {
  status: number | string
  data: { message: string }
}

export type AuthRole = "admin" | "manager"

export type AuthUser = {
  id: string
  email: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: AuthUser
  role: AuthRole
  token: string
}

export type TableRecord = {
  id: string
  table_number: string
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
  table_number?: string
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
  table_number: string
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
  table_number?: string
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
    table_number: string
    session_count: number
    total_revenue: number
  }>
  daily_revenue: Array<{
    date: string
    revenue: number
    order_count: number
  }>
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "out_for_delivery",
]

const HISTORY_STATUSES: OrderStatus[] = ["delivered", "cancelled"]

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

// ──────────────────────────────────────────────
// Mock Database
// ──────────────────────────────────────────────

const mockDb: {
  tables: TableRecord[]
  menu: MenuRecord[]
  orders: OrderRecord[]
  sessions: TableSession[]
  invoices: InvoiceRecord[]
} = {
  tables: [
    { id: "tbl-1", table_number: "T1", capacity: 4, status: "occupied", active_order_count: 2 },
    { id: "tbl-2", table_number: "T2", capacity: 2, status: "available", active_order_count: 0 },
    { id: "tbl-3", table_number: "T3", capacity: 6, status: "occupied", active_order_count: 1 },
    { id: "tbl-4", table_number: "T4", capacity: 4, status: "available", active_order_count: 0 },
    { id: "tbl-5", table_number: "T5", capacity: 8, status: "available", active_order_count: 0 },
  ],
  menu: [
    { id: "m-1", name: "Paneer Lababdar", price: 280, is_available: true },
    { id: "m-2", name: "Butter Naan", price: 55, is_available: true },
    { id: "m-3", name: "Chicken Biryani", price: 340, is_available: true },
    { id: "m-4", name: "Veg Hakka Noodles", price: 210, is_available: true },
    { id: "m-5", name: "Gulab Jamun", price: 90, is_available: true },
    { id: "m-6", name: "Dal Makhani", price: 240, is_available: true },
    { id: "m-7", name: "Tandoori Roti", price: 35, is_available: true },
    { id: "m-8", name: "Raita", price: 60, is_available: true },
  ],
  orders: [
    // Active orders for T1 session
    {
      id: "ord-101",
      order_type: "table",
      table_id: "tbl-1",
      table_number: "T1",
      session_id: "ses-1",
      status: "served",
      items: [
        { id: "oi-1", menu_item_id: "m-1", menu_item_name: "Paneer Lababdar", quantity: 1, unit_price: 280, line_total: 280 },
        { id: "oi-2", menu_item_id: "m-2", menu_item_name: "Butter Naan", quantity: 2, unit_price: 55, line_total: 110 },
      ],
      subtotal: 390,
      gst: 19.5,
      total: 409.5,
      created_at: minutesAgo(45),
    },
    {
      id: "ord-102",
      order_type: "table",
      table_id: "tbl-1",
      table_number: "T1",
      session_id: "ses-1",
      status: "preparing",
      items: [
        { id: "oi-3", menu_item_id: "m-5", menu_item_name: "Gulab Jamun", quantity: 2, unit_price: 90, line_total: 180 },
        { id: "oi-4", menu_item_id: "m-8", menu_item_name: "Raita", quantity: 1, unit_price: 60, line_total: 60 },
      ],
      subtotal: 240,
      gst: 12,
      total: 252,
      created_at: minutesAgo(10),
    },
    // Active order for T3 session
    {
      id: "ord-103",
      order_type: "table",
      table_id: "tbl-3",
      table_number: "T3",
      session_id: "ses-2",
      status: "confirmed",
      items: [
        { id: "oi-5", menu_item_id: "m-4", menu_item_name: "Veg Hakka Noodles", quantity: 2, unit_price: 210, line_total: 420 },
        { id: "oi-6", menu_item_id: "m-6", menu_item_name: "Dal Makhani", quantity: 1, unit_price: 240, line_total: 240 },
      ],
      subtotal: 660,
      gst: 33,
      total: 693,
      created_at: minutesAgo(20),
    },
    // Historical - closed session from yesterday
    {
      id: "ord-090",
      order_type: "table",
      table_id: "tbl-5",
      table_number: "T5",
      session_id: "ses-closed-1",
      status: "delivered",
      items: [
        { id: "oi-7", menu_item_id: "m-1", menu_item_name: "Paneer Lababdar", quantity: 1, unit_price: 280, line_total: 280 },
        { id: "oi-8", menu_item_id: "m-7", menu_item_name: "Tandoori Roti", quantity: 4, unit_price: 35, line_total: 140 },
      ],
      subtotal: 420,
      gst: 21,
      total: 441,
      created_at: daysAgo(1),
    },
    {
      id: "ord-091",
      order_type: "table",
      table_id: "tbl-5",
      table_number: "T5",
      session_id: "ses-closed-1",
      status: "delivered",
      items: [
        { id: "oi-9", menu_item_id: "m-5", menu_item_name: "Gulab Jamun", quantity: 3, unit_price: 90, line_total: 270 },
      ],
      subtotal: 270,
      gst: 13.5,
      total: 283.5,
      created_at: daysAgo(1),
    },
    // Historical takeaway orders
    {
      id: "ord-080",
      order_type: "takeaway",
      status: "delivered",
      items: [
        { id: "oi-10", menu_item_id: "m-3", menu_item_name: "Chicken Biryani", quantity: 2, unit_price: 340, line_total: 680 },
      ],
      subtotal: 680,
      gst: 34,
      total: 714,
      created_at: daysAgo(2),
    },
    {
      id: "ord-081",
      order_type: "takeaway",
      status: "delivered",
      items: [
        { id: "oi-11", menu_item_id: "m-4", menu_item_name: "Veg Hakka Noodles", quantity: 1, unit_price: 210, line_total: 210 },
        { id: "oi-12", menu_item_id: "m-2", menu_item_name: "Butter Naan", quantity: 3, unit_price: 55, line_total: 165 },
      ],
      subtotal: 375,
      gst: 18.75,
      total: 393.75,
      created_at: daysAgo(3),
    },
    // More historical for insights
    {
      id: "ord-070",
      order_type: "table",
      table_id: "tbl-2",
      table_number: "T2",
      session_id: "ses-closed-2",
      status: "delivered",
      items: [
        { id: "oi-13", menu_item_id: "m-6", menu_item_name: "Dal Makhani", quantity: 2, unit_price: 240, line_total: 480 },
        { id: "oi-14", menu_item_id: "m-7", menu_item_name: "Tandoori Roti", quantity: 6, unit_price: 35, line_total: 210 },
      ],
      subtotal: 690,
      gst: 34.5,
      total: 724.5,
      created_at: daysAgo(4),
    },
    {
      id: "ord-060",
      order_type: "takeaway",
      status: "delivered",
      items: [
        { id: "oi-15", menu_item_id: "m-1", menu_item_name: "Paneer Lababdar", quantity: 1, unit_price: 280, line_total: 280 },
        { id: "oi-16", menu_item_id: "m-2", menu_item_name: "Butter Naan", quantity: 2, unit_price: 55, line_total: 110 },
      ],
      subtotal: 390,
      gst: 19.5,
      total: 409.5,
      created_at: daysAgo(5),
    },
    {
      id: "ord-050",
      order_type: "table",
      table_id: "tbl-4",
      table_number: "T4",
      session_id: "ses-closed-3",
      status: "delivered",
      items: [
        { id: "oi-17", menu_item_id: "m-3", menu_item_name: "Chicken Biryani", quantity: 3, unit_price: 340, line_total: 1020 },
        { id: "oi-18", menu_item_id: "m-8", menu_item_name: "Raita", quantity: 3, unit_price: 60, line_total: 180 },
      ],
      subtotal: 1200,
      gst: 60,
      total: 1260,
      created_at: daysAgo(6),
    },
    // Delivery order (from delivery app, shown in history)
    {
      id: "ord-040",
      order_type: "delivery",
      status: "delivered",
      items: [
        { id: "oi-19", menu_item_id: "m-3", menu_item_name: "Chicken Biryani", quantity: 1, unit_price: 340, line_total: 340 },
      ],
      subtotal: 340,
      gst: 17,
      total: 357,
      created_at: daysAgo(2),
    },
  ],
  sessions: [
    // Active sessions
    {
      id: "ses-1",
      table_id: "tbl-1",
      table_number: "T1",
      status: "open",
      order_ids: ["ord-101", "ord-102"],
      subtotal: 630,
      gst: 31.5,
      total: 661.5,
      created_at: minutesAgo(45),
    },
    {
      id: "ses-2",
      table_id: "tbl-3",
      table_number: "T3",
      status: "open",
      order_ids: ["ord-103"],
      subtotal: 660,
      gst: 33,
      total: 693,
      created_at: minutesAgo(20),
    },
    // Closed sessions
    {
      id: "ses-closed-1",
      table_id: "tbl-5",
      table_number: "T5",
      status: "closed",
      order_ids: ["ord-090", "ord-091"],
      subtotal: 690,
      gst: 34.5,
      total: 724.5,
      created_at: daysAgo(1),
      closed_at: daysAgo(1),
    },
    {
      id: "ses-closed-2",
      table_id: "tbl-2",
      table_number: "T2",
      status: "closed",
      order_ids: ["ord-070"],
      subtotal: 690,
      gst: 34.5,
      total: 724.5,
      created_at: daysAgo(4),
      closed_at: daysAgo(4),
    },
    {
      id: "ses-closed-3",
      table_id: "tbl-4",
      table_number: "T4",
      status: "closed",
      order_ids: ["ord-050"],
      subtotal: 1200,
      gst: 60,
      total: 1260,
      created_at: daysAgo(6),
      closed_at: daysAgo(6),
    },
  ],
  invoices: [
    {
      id: "inv-001",
      session_id: "ses-closed-1",
      order_type: "table",
      table_number: "T5",
      items: [
        { id: "oi-7", menu_item_id: "m-1", menu_item_name: "Paneer Lababdar", quantity: 1, unit_price: 280, line_total: 280 },
        { id: "oi-8", menu_item_id: "m-7", menu_item_name: "Tandoori Roti", quantity: 4, unit_price: 35, line_total: 140 },
        { id: "oi-9", menu_item_id: "m-5", menu_item_name: "Gulab Jamun", quantity: 3, unit_price: 90, line_total: 270 },
      ],
      subtotal: 690,
      gst: 34.5,
      total: 724.5,
      created_at: daysAgo(1),
    },
    {
      id: "inv-002",
      order_id: "ord-080",
      order_type: "takeaway",
      items: [
        { id: "oi-10", menu_item_id: "m-3", menu_item_name: "Chicken Biryani", quantity: 2, unit_price: 340, line_total: 680 },
      ],
      subtotal: 680,
      gst: 34,
      total: 714,
      created_at: daysAgo(2),
    },
  ],
}

function toError(message: string): ApiError {
  return {
    status: "CUSTOM_ERROR",
    data: { message },
  }
}

function toOrderItems(items: CreateOrderItemInput[]) {
  const mapped = items.map((item) => {
    const menu = mockDb.menu.find((entry) => entry.id === item.menu_item_id)

    return {
      id: uid("oi"),
      menu_item_id: item.menu_item_id,
      menu_item_name: menu?.name ?? "Unknown item",
      quantity: item.quantity,
      unit_price: menu?.price ?? 0,
      line_total: (menu?.price ?? 0) * item.quantity,
    }
  })

  const subtotal = mapped.reduce((sum, item) => sum + item.line_total, 0)
  const gst = Number((subtotal * 0.05).toFixed(2))
  const total = Number((subtotal + gst).toFixed(2))

  return { mapped, subtotal, gst, total }
}

function syncTableOccupancy(tableId: string) {
  const table = mockDb.tables.find((entry) => entry.id === tableId)
  if (!table) return

  const openSession = mockDb.sessions.find(
    (s) => s.table_id === tableId && s.status === "open",
  )

  if (openSession) {
    const activeOrderCount = mockDb.orders.filter(
      (o) => openSession.order_ids.includes(o.id) && ACTIVE_STATUSES.includes(o.status),
    ).length
    table.active_order_count = activeOrderCount
    table.status = "occupied"
  } else {
    table.active_order_count = 0
    table.status = "available"
  }
}

function recalcSessionTotals(session: TableSession) {
  const sessionOrders = mockDb.orders.filter((o) => session.order_ids.includes(o.id))
  session.subtotal = sessionOrders.reduce((sum, o) => sum + o.subtotal, 0)
  session.gst = Number((session.subtotal * 0.05).toFixed(2))
  session.total = Number((session.subtotal + session.gst).toFixed(2))
}

function computeInsights(period: InsightsPeriod): InsightsRecord {
  const now = Date.now()
  const cutoff = period === "week" ? 7 : 30
  const cutoffDate = new Date(now - cutoff * 24 * 60 * 60 * 1000)

  const periodOrders = mockDb.orders.filter(
    (o) => new Date(o.created_at) >= cutoffDate,
  )

  const completedOrders = periodOrders.filter((o) =>
    ["delivered", "served"].includes(o.status) || ACTIVE_STATUSES.includes(o.status),
  )

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = completedOrders.length
  const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0

  // Order type breakdown
  const orderTypeBreakdown = { table: 0, takeaway: 0, delivery: 0 }
  completedOrders.forEach((o) => {
    orderTypeBreakdown[o.order_type] = (orderTypeBreakdown[o.order_type] || 0) + 1
  })

  // Top items
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>()
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const existing = itemMap.get(item.menu_item_name)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.line_total
      } else {
        itemMap.set(item.menu_item_name, {
          name: item.menu_item_name,
          quantity: item.quantity,
          revenue: item.line_total,
        })
      }
    })
  })
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Table utilization
  const tableSessionMap = new Map<string, { table_number: string; session_count: number; total_revenue: number }>()
  mockDb.sessions
    .filter((s) => new Date(s.created_at) >= cutoffDate)
    .forEach((s) => {
      const existing = tableSessionMap.get(s.table_number)
      if (existing) {
        existing.session_count += 1
        existing.total_revenue += s.total
      } else {
        tableSessionMap.set(s.table_number, {
          table_number: s.table_number,
          session_count: 1,
          total_revenue: s.total,
        })
      }
    })
  const tableUtilization = Array.from(tableSessionMap.values())
    .sort((a, b) => b.session_count - a.session_count)

  // Daily revenue
  const dailyMap = new Map<string, { date: string; revenue: number; order_count: number }>()
  for (let i = 0; i < cutoff; i++) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    dailyMap.set(dateStr, { date: dateStr, revenue: 0, order_count: 0 })
  }
  completedOrders.forEach((o) => {
    const dateStr = o.created_at.slice(0, 10)
    const entry = dailyMap.get(dateStr)
    if (entry) {
      entry.revenue += o.total
      entry.order_count += 1
    }
  })
  const dailyRevenue = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  return {
    period,
    total_revenue: Number(totalRevenue.toFixed(2)),
    total_orders: totalOrders,
    average_order_value: averageOrderValue,
    order_type_breakdown: orderTypeBreakdown,
    top_items: topItems,
    table_utilization: tableUtilization,
    daily_revenue: dailyRevenue,
  }
}

// ──────────────────────────────────────────────
// API Definition
// ──────────────────────────────────────────────

export const rimsApi = createApi({
  reducerPath: "rimsApi",
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ["Auth", "Table", "Menu", "Order", "History", "Invoice", "Session", "Insights"],
  endpoints: (builder) => ({
    // ── Auth ──────────────────────────────────

    login: builder.mutation<LoginResponse, LoginRequest>({
      async queryFn(payload) {
        await delay()

        if (!payload.email || !payload.password) {
          return { error: toError("Email and password are required") }
        }

        if (payload.password.length < 4) {
          return { error: toError("Invalid credentials") }
        }

        return {
          data: {
            user: {
              id: "rims-user-1",
              email: payload.email.toLowerCase(),
            },
            role: payload.email.includes("manager") ? "manager" : "admin",
            token: `mock-rims-token-${Date.now()}`,
          },
        }
      },
      invalidatesTags: ["Auth"],
    }),

    // ── Tables ────────────────────────────────

    getTables: builder.query<TableRecord[], void>({
      async queryFn() {
        await delay()
        return {
          data: [...mockDb.tables].sort((a, b) => a.table_number.localeCompare(b.table_number)),
        }
      },
      providesTags: ["Table"],
    }),

    createTable: builder.mutation<TableRecord, { table_number: string; capacity?: number }>({
      async queryFn(payload) {
        await delay()

        const tableNumber = payload.table_number.trim()
        if (!tableNumber) {
          return { error: toError("table_number is required") }
        }

        const duplicate = mockDb.tables.some(
          (entry) => entry.table_number.toLowerCase() === tableNumber.toLowerCase(),
        )
        if (duplicate) {
          return { error: toError("table_number must be unique") }
        }

        const record: TableRecord = {
          id: uid("tbl"),
          table_number: tableNumber,
          capacity: payload.capacity,
          status: "available",
          active_order_count: 0,
        }

        mockDb.tables.push(record)
        return { data: record }
      },
      invalidatesTags: ["Table"],
    }),

    updateTable: builder.mutation<
      TableRecord,
      { id: string; table_number: string; capacity?: number }
    >({
      async queryFn(payload) {
        await delay()

        const index = mockDb.tables.findIndex((entry) => entry.id === payload.id)
        if (index < 0) {
          return { error: toError("Table not found") }
        }

        const tableNumber = payload.table_number.trim()
        if (!tableNumber) {
          return { error: toError("table_number is required") }
        }

        const duplicate = mockDb.tables.some(
          (entry) =>
            entry.id !== payload.id &&
            entry.table_number.toLowerCase() === tableNumber.toLowerCase(),
        )
        if (duplicate) {
          return { error: toError("table_number must be unique") }
        }

        const updated = {
          ...mockDb.tables[index],
          table_number: tableNumber,
          capacity: payload.capacity,
        }

        mockDb.tables[index] = updated
        return { data: updated }
      },
      invalidatesTags: ["Table"],
    }),

    deleteTable: builder.mutation<{ success: boolean; id: string }, { id: string }>({
      async queryFn(payload) {
        await delay()
        mockDb.tables = mockDb.tables.filter((entry) => entry.id !== payload.id)
        return { data: { success: true, id: payload.id } }
      },
      invalidatesTags: ["Table"],
    }),

    // ── Menu ──────────────────────────────────

    getMenu: builder.query<MenuRecord[], void>({
      async queryFn() {
        await delay()
        return { data: mockDb.menu }
      },
      providesTags: ["Menu"],
    }),

    // ── Sessions ──────────────────────────────

    getTableSessions: builder.query<(TableSession & { orders: OrderRecord[] })[], void>({
      async queryFn() {
        await delay()

        const openSessions = mockDb.sessions.filter((s) => s.status === "open")
        const result = openSessions.map((session) => ({
          ...session,
          orders: mockDb.orders.filter((o) => session.order_ids.includes(o.id)),
        }))

        return { data: result }
      },
      providesTags: ["Session"],
    }),

    getTableSessionById: builder.query<
      TableSession & { orders: OrderRecord[] },
      { id: string }
    >({
      async queryFn(payload) {
        await delay()

        const session = mockDb.sessions.find((s) => s.id === payload.id)
        if (!session) {
          return { error: toError("Session not found") }
        }

        return {
          data: {
            ...session,
            orders: mockDb.orders.filter((o) => session.order_ids.includes(o.id)),
          },
        }
      },
      providesTags: ["Session"],
    }),

    closeTableSession: builder.mutation<
      InvoiceRecord,
      { session_id: string }
    >({
      async queryFn(payload) {
        await delay()

        const session = mockDb.sessions.find((s) => s.id === payload.session_id)
        if (!session) {
          return { error: toError("Session not found") }
        }

        if (session.status === "closed") {
          const existing = mockDb.invoices.find((inv) => inv.session_id === session.id)
          if (existing) return { data: existing }
          return { error: toError("Session already closed") }
        }

        // Mark all active session orders as delivered
        const sessionOrders = mockDb.orders.filter((o) => session.order_ids.includes(o.id))
        sessionOrders.forEach((o) => {
          if (ACTIVE_STATUSES.includes(o.status)) {
            o.status = "delivered"
          }
        })

        // Recalculate and close session
        recalcSessionTotals(session)
        session.status = "closed"
        session.closed_at = new Date().toISOString()

        // Aggregate all items from all orders
        const allItems = sessionOrders.flatMap((o) => o.items)

        const invoice: InvoiceRecord = {
          id: uid("inv"),
          session_id: session.id,
          order_type: "table",
          table_number: session.table_number,
          items: allItems,
          subtotal: session.subtotal,
          gst: session.gst,
          total: session.total,
          created_at: new Date().toISOString(),
        }

        mockDb.invoices.unshift(invoice)

        // Update table status
        syncTableOccupancy(session.table_id)

        return { data: invoice }
      },
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
      async queryFn(payload) {
        await delay()

        if (payload.items.length === 0) {
          return { error: toError("Add at least one menu item") }
        }

        if (payload.order_type === "table" && !payload.table_id) {
          return { error: toError("Select a table for dine-in order") }
        }

        const { mapped, subtotal, gst, total } = toOrderItems(payload.items)
        const table = payload.table_id
          ? mockDb.tables.find((entry) => entry.id === payload.table_id)
          : undefined

        let sessionId: string | undefined

        // For table orders, find or create a session
        if (payload.order_type === "table" && payload.table_id && table) {
          let openSession = mockDb.sessions.find(
            (s) => s.table_id === payload.table_id && s.status === "open",
          )

          if (!openSession) {
            openSession = {
              id: uid("ses"),
              table_id: payload.table_id,
              table_number: table.table_number,
              status: "open",
              order_ids: [],
              subtotal: 0,
              gst: 0,
              total: 0,
              created_at: new Date().toISOString(),
            }
            mockDb.sessions.push(openSession)
          }

          sessionId = openSession.id
        }

        const order: OrderRecord = {
          id: uid("ord"),
          order_type: payload.order_type,
          table_id: payload.table_id,
          table_number: table?.table_number,
          session_id: sessionId,
          status: "pending",
          items: mapped,
          subtotal,
          gst,
          total,
          created_at: new Date().toISOString(),
        }

        mockDb.orders.unshift(order)

        // Update session
        if (sessionId) {
          const session = mockDb.sessions.find((s) => s.id === sessionId)
          if (session) {
            session.order_ids.push(order.id)
            recalcSessionTotals(session)
          }
          syncTableOccupancy(payload.table_id!)
        }

        return { data: order }
      },
      invalidatesTags: ["Order", "History", "Table", "Session", "Insights"],
    }),

    getOrders: builder.query<OrderRecord[], void>({
      async queryFn() {
        await delay()
        return {
          data: mockDb.orders.filter((entry) => ACTIVE_STATUSES.includes(entry.status)),
        }
      },
      providesTags: ["Order"],
    }),

    updateOrderStatus: builder.mutation<OrderRecord, { id: string; status: OrderStatus }>({
      async queryFn(payload) {
        await delay()

        const index = mockDb.orders.findIndex((entry) => entry.id === payload.id)
        if (index < 0) {
          return { error: toError("Order not found") }
        }

        const updated = {
          ...mockDb.orders[index],
          status: payload.status,
        }

        mockDb.orders[index] = updated

        if (updated.table_id) {
          syncTableOccupancy(updated.table_id)
        }

        return { data: updated }
      },
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
      async queryFn(filters) {
        await delay()

        let records = mockDb.orders.filter((entry) => HISTORY_STATUSES.includes(entry.status))

        if (filters.date) {
          records = records.filter((entry) => entry.created_at.slice(0, 10) === filters.date)
        }

        if (filters.table_id) {
          records = records.filter((entry) => entry.table_id === filters.table_id)
        }

        if (filters.order_type && filters.order_type !== "all") {
          records = records.filter((entry) => entry.order_type === filters.order_type)
        }

        return { data: records }
      },
      providesTags: ["History"],
    }),

    // ── Takeaway ──────────────────────────────

    createTakeawayOrder: builder.mutation<
      { order: OrderRecord; invoice: InvoiceRecord },
      { items: CreateOrderItemInput[] }
    >({
      async queryFn(payload) {
        await delay()

        if (payload.items.length === 0) {
          return { error: toError("Add at least one menu item") }
        }

        const { mapped, subtotal, gst, total } = toOrderItems(payload.items)

        const order: OrderRecord = {
          id: uid("ord"),
          order_type: "takeaway",
          status: "delivered",
          items: mapped,
          subtotal,
          gst,
          total,
          created_at: new Date().toISOString(),
        }

        mockDb.orders.unshift(order)

        const invoice: InvoiceRecord = {
          id: uid("inv"),
          order_id: order.id,
          order_type: "takeaway",
          items: mapped,
          subtotal,
          gst,
          total,
          created_at: new Date().toISOString(),
        }

        mockDb.invoices.unshift(invoice)

        return { data: { order, invoice } }
      },
      invalidatesTags: ["Order", "History", "Invoice", "Insights"],
    }),

    // ── Invoices ──────────────────────────────

    generateInvoice: builder.mutation<InvoiceRecord, { order_id?: string; session_id?: string }>({
      async queryFn(payload) {
        await delay()

        if (payload.session_id) {
          const session = mockDb.sessions.find((s) => s.id === payload.session_id)
          if (!session) return { error: toError("Session not found") }

          const existing = mockDb.invoices.find((inv) => inv.session_id === payload.session_id)
          if (existing) return { data: existing }

          const sessionOrders = mockDb.orders.filter((o) => session.order_ids.includes(o.id))
          const allItems = sessionOrders.flatMap((o) => o.items)

          const invoice: InvoiceRecord = {
            id: uid("inv"),
            session_id: session.id,
            order_type: "table",
            table_number: session.table_number,
            items: allItems,
            subtotal: session.subtotal,
            gst: session.gst,
            total: session.total,
            created_at: new Date().toISOString(),
          }

          mockDb.invoices.unshift(invoice)
          return { data: invoice }
        }

        if (payload.order_id) {
          const order = mockDb.orders.find((entry) => entry.id === payload.order_id)
          if (!order) return { error: toError("Order not found") }

          const existing = mockDb.invoices.find((entry) => entry.order_id === payload.order_id)
          if (existing) return { data: existing }

          const invoice: InvoiceRecord = {
            id: uid("inv"),
            order_id: order.id,
            order_type: order.order_type,
            table_number: order.table_number,
            items: order.items,
            subtotal: order.subtotal,
            gst: order.gst,
            total: order.total,
            created_at: new Date().toISOString(),
          }

          mockDb.invoices.unshift(invoice)
          return { data: invoice }
        }

        return { error: toError("Provide order_id or session_id") }
      },
      invalidatesTags: ["Invoice"],
    }),

    getInvoice: builder.query<InvoiceRecord, { id: string }>({
      async queryFn(payload) {
        await delay()

        const invoice = mockDb.invoices.find((entry) => entry.id === payload.id)
        if (!invoice) {
          return { error: toError("Invoice not found") }
        }

        return { data: invoice }
      },
      providesTags: ["Invoice"],
    }),

    // ── Insights ──────────────────────────────

    getInsights: builder.query<InsightsRecord, { period: InsightsPeriod }>({
      async queryFn(payload) {
        await delay(300)
        return { data: computeInsights(payload.period) }
      },
      providesTags: ["Insights"],
    }),
  }),
})

export const {
  useLoginMutation,
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
