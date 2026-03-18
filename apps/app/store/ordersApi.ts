import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// API Response wrapper
interface ApiResponse<T> {
    success: boolean
    statusCode: number
    message: string
    data: T
    error: string | null
}

export interface OrderItem {
    id: string
    name: string
    quantity: number
    price: number
    size?: 'Full' | 'Half'
    image?: string
}

export interface Order {
    id: string
    user_id: string
    items: OrderItem[]
    total: number
    status: 'pending' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
    createdAt: string
    updatedAt?: string
    estimatedCompletionTime?: string
    deliveryAddress: string
    deliveryInstructions?: string
    customerName?: string
    customerPhone?: string
}

// Minimal payload for creating order - backend will fetch cart and calculate total
export interface CreateOrderInput {
    addressId: string  // Reference to saved address
    deliveryInstructions?: string
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const ordersApi = createApi({
    reducerPath: 'ordersApi',
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers: Headers, { getState }: any) => {
            const state = getState() as { auth?: { token?: string | null } }
            const token = state?.auth?.token
            if (token) headers.set('authorization', `Bearer ${token}`)
            return headers
        }
    }),
    tagTypes: ['Order'],
    endpoints: (builder) => ({
        // Get all orders (for Admin/Staff)
        getAllOrders: builder.query<Order[], void>({
            query: () => 'orders',
            transformResponse: (response: ApiResponse<Order[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Order' as const, id })),
                        { type: 'Order', id: 'LIST' },
                    ]
                    : [{ type: 'Order', id: 'LIST' }],
        }),
        // Get my orders (for Customer)
        getMyOrders: builder.query<Order[], void>({
            query: () => 'orders/my',
            transformResponse: (response: ApiResponse<Order[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Order' as const, id })),
                        { type: 'Order', id: 'MY_LIST' },
                    ]
                    : [{ type: 'Order', id: 'MY_LIST' }],
        }),
        // Get single order by ID
        getOrderById: builder.query<Order, string>({
            query: (id) => `orders/${id}`,
            transformResponse: (response: ApiResponse<Order>) => response.data,
            providesTags: (result, error, id) => [{ type: 'Order', id }],
        }),
        // Create new order - minimal payload, backend fetches cart
        createOrder: builder.mutation<Order, CreateOrderInput>({
            query: (body) => ({
                url: 'orders',
                method: 'POST',
                body,
            }),
            transformResponse: (response: ApiResponse<Order>) => response.data,
            invalidatesTags: [{ type: 'Order', id: 'MY_LIST' }, { type: 'Order', id: 'LIST' }],
        }),
        // Update order status (for Admin/Staff)
        updateOrderStatus: builder.mutation<Order, { id: string; status: string }>({
            query: ({ id, status }) => ({
                url: `orders/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            transformResponse: (response: ApiResponse<Order>) => response.data,
            invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, { type: 'Order', id: 'LIST' }],
        }),
        // Cancel order (for Customer - only if pending)
        cancelOrder: builder.mutation<Order, string>({
            query: (id) => ({
                url: `orders/${id}/cancel`,
                method: 'POST',
            }),
            transformResponse: (response: ApiResponse<Order>) => response.data,
            invalidatesTags: (result, error, id) => [{ type: 'Order', id }, { type: 'Order', id: 'MY_LIST' }],
        }),

        // =====================
        // Rider Endpoints
        // =====================

        // Get orders ready for pickup (Rider)
        getReadyOrders: builder.query<Order[], void>({
            query: () => 'orders/rider/ready',
            transformResponse: (response: ApiResponse<Order[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Order' as const, id })),
                        { type: 'Order', id: 'READY_LIST' },
                    ]
                    : [{ type: 'Order', id: 'READY_LIST' }],
        }),

        // Get orders out for delivery (Rider)
        getMyDeliveries: builder.query<Order[], void>({
            query: () => 'orders/rider/my-deliveries',
            transformResponse: (response: ApiResponse<Order[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Order' as const, id })),
                        { type: 'Order', id: 'DELIVERY_LIST' },
                    ]
                    : [{ type: 'Order', id: 'DELIVERY_LIST' }],
        }),

        // Mark order as picked up / out for delivery (Rider)
        pickupOrder: builder.mutation<Order, string>({
            query: (id) => ({
                url: `orders/rider/${id}/pickup`,
                method: 'PATCH',
            }),
            transformResponse: (response: ApiResponse<Order>) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'Order', id },
                { type: 'Order', id: 'READY_LIST' },
                { type: 'Order', id: 'DELIVERY_LIST' },
            ],
        }),

        // Mark order as delivered (Rider)
        deliverOrder: builder.mutation<Order, string>({
            query: (id) => ({
                url: `orders/rider/${id}/deliver`,
                method: 'PATCH',
            }),
            transformResponse: (response: ApiResponse<Order>) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'Order', id },
                { type: 'Order', id: 'DELIVERY_LIST' },
            ],
        }),
    }),
})

export const {
    useGetAllOrdersQuery,
    useGetMyOrdersQuery,
    useGetOrderByIdQuery,
    useCreateOrderMutation,
    useUpdateOrderStatusMutation,
    useCancelOrderMutation,
    useGetReadyOrdersQuery,
    useGetMyDeliveriesQuery,
    usePickupOrderMutation,
    useDeliverOrderMutation,
} = ordersApi
