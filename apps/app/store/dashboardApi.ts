import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// API Response wrapper
interface ApiResponse<T> {
    success: boolean
    statusCode: number
    message: string
    data: T
    error: string | null
}

// Interfaces for Dashboard Data
export interface DashboardStats {
    totalOrdersToday: number
    totalOrdersComparePercentage: number // e.g. 12 for +12%, -5 for -5%
    revenueToday: number
    revenueComparePercentage: number
    activeOrdersCount: number
    totalMenuItems: number
}

export interface DashboardRecentOrder {
    id: string
    customerName: string
    itemsSummary: string[] // e.g. ["Butter Chicken", "Naan"]
    totalAmount: number
    status: 'pending' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
    createdAt: string // ISO Timestamp
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers: Headers, { getState }: any) => {
            const state = getState() as { auth?: { token?: string | null } }
            const token = state?.auth?.token
            if (token) headers.set('authorization', `Bearer ${token}`)
            return headers
        }
    }),
    tagTypes: ['Dashboard'],
    endpoints: (builder) => ({
        getDashboardStats: builder.query<DashboardStats, void>({
            query: () => 'admin/dashboard/stats',
            transformResponse: (response: ApiResponse<DashboardStats>) => response.data,
            providesTags: ['Dashboard']
        }),
        getRecentOrders: builder.query<DashboardRecentOrder[], void>({
            query: () => 'admin/dashboard/recent-orders?limit=3',
            transformResponse: (response: ApiResponse<DashboardRecentOrder[]>) => response.data,
            providesTags: ['Dashboard']
        }),
    }),
})

export const { useGetDashboardStatsQuery, useGetRecentOrdersQuery } = dashboardApi
