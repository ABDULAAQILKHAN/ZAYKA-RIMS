import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Address {
    id: string
    userId: string
    value: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
}

interface ApiResponse<T> {
    success: boolean
    statusCode: number
    message: string
    data: T
    error: any
    timestamp: string
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const addressApi = createApi({
    reducerPath: 'addressApi',
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers: Headers, { getState }: any) => {
            const state = getState() as { auth?: { token?: string | null } }
            const token = state?.auth?.token
            if (token) headers.set('authorization', `Bearer ${token}`)
            return headers
        }
    }),
    tagTypes: ['Address', 'Profile'], // Invalidate Profile too since default address helps profile
    endpoints: (builder) => ({
        getAddresses: builder.query<Address[], void>({
            query: () => 'address',
            transformResponse: (response: ApiResponse<Address[]>) => response.data,
            providesTags: ['Address']
        }),
        addAddress: builder.mutation<Address, { value: string, isDefault?: boolean }>({
            query: ({ value, isDefault }) => ({
                url: 'address',
                method: isDefault ? 'POST' : 'PUT', // POST sets default, PUT just adds
                body: { value }
            }),
            invalidatesTags: ['Address', 'Profile']
        }),
        deleteAddress: builder.mutation<void, number>({
            query: (index) => ({
                url: `address/${index}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Address', 'Profile']
        }),
        setDefaultAddress: builder.mutation<void, number>({
            query: (index) => ({
                url: `address/${index}/default`,
                method: 'PUT'
            }),
            invalidatesTags: ['Address', 'Profile']
        })
    })
})

export const {
    useGetAddressesQuery,
    useAddAddressMutation,
    useDeleteAddressMutation,
    useSetDefaultAddressMutation
} = addressApi
