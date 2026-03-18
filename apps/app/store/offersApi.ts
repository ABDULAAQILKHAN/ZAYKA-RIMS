import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface SpecialOffer {
  id: string
  title: string
  description: string
  image: string
  link?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TodaysSpecialItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVeg: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CreateSpecialOfferInput extends Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'> {}
interface UpdateSpecialOfferInput extends Partial<Omit<SpecialOffer, 'id'>> { id: string }

interface CreateTodaysSpecialInput extends Omit<TodaysSpecialItem, 'id' | 'createdAt' | 'updatedAt'> {}
interface UpdateTodaysSpecialInput extends Partial<Omit<TodaysSpecialItem, 'id'>> { id: string }

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const offersApi = createApi({
  reducerPath: 'offersApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers: Headers, { getState }: any) => {
      const state = getState() as { auth?: { token?: string | null } }
      const token = state?.auth?.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ['SpecialOffer', 'TodaysSpecial'],
  endpoints: (builder) => ({
    // Special Offers
    getSpecialOffers: builder.query<SpecialOffer[], void>({
      query: () => 'special-offers',
      transformResponse: (response: any) => {
        console.log('getSpecialOffers raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.specialOffers)) {
          return response.specialOffers
        }
        console.warn('Unexpected response structure for special offers:', response)
        return []
      },
      providesTags: (result) => {
        if (!result || !Array.isArray(result)) {
          console.log('getSpecialOffers result is not an array:', result)
          return [{ type: 'SpecialOffer', id: 'LIST' }]
        }
        return [...result.map(r => ({ type: 'SpecialOffer' as const, id: r.id })), { type: 'SpecialOffer', id: 'LIST' }]
      }
    }),
    getActiveSpecialOffers: builder.query<SpecialOffer[], void>({
      query: () => 'special-offers?active=true',
      transformResponse: (response: any) => {
        console.log('getActiveSpecialOffers raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.specialOffers)) {
          return response.specialOffers
        }
        console.warn('Unexpected response structure for active special offers:', response)
        return []
      },
      providesTags: [{ type: 'SpecialOffer', id: 'ACTIVE' }]
    }),
    getSpecialOfferById: builder.query<SpecialOffer, string>({
      query: (id) => `special-offers/${id}`,
      transformResponse: (response: any) => {
        console.log('getSpecialOfferById raw response:', response)
        // Handle different response structures
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // If response has data, item, or offer property, use that
          if (response.data) return response.data
          if (response.item) return response.item
          if (response.offer) return response.offer
          if (response.specialOffer) return response.specialOffer
          // Otherwise assume the response itself is the item
          return response
        }
        return response
      },
      providesTags: (result, error, id) => [{ type: 'SpecialOffer', id }]
    }),
    createSpecialOffer: builder.mutation<SpecialOffer, CreateSpecialOfferInput>({
      query: (body) => ({ url: 'special-offers', method: 'POST', body }),
      invalidatesTags: [{ type: 'SpecialOffer', id: 'LIST' }, { type: 'SpecialOffer', id: 'ACTIVE' }]
    }),
    updateSpecialOffer: builder.mutation<SpecialOffer, UpdateSpecialOfferInput>({
      query: ({ id, ...patch }) => ({ url: `special-offers/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (result, error, arg) => [
        { type: 'SpecialOffer', id: arg.id },
        { type: 'SpecialOffer', id: 'LIST' },
        { type: 'SpecialOffer', id: 'ACTIVE' }
      ]
    }),
    deleteSpecialOffer: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({ url: `special-offers/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'SpecialOffer', id },
        { type: 'SpecialOffer', id: 'LIST' },
        { type: 'SpecialOffer', id: 'ACTIVE' }
      ]
    }),

    // Today's Special Items
    getTodaysSpecials: builder.query<TodaysSpecialItem[], void>({
      query: () => 'todays-specials',
      transformResponse: (response: any) => {
        console.log('getTodaysSpecials raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.specials)) {
          return response.specials
        }
        if (response && Array.isArray(response.todaysSpecials)) {
          return response.todaysSpecials
        }
        console.warn('Unexpected response structure for todays specials:', response)
        return []
      },
      providesTags: (result) => {
        if (!result || !Array.isArray(result)) {
          console.log('getTodaysSpecials result is not an array:', result)
          return [{ type: 'TodaysSpecial', id: 'LIST' }]
        }
        return [...result.map(r => ({ type: 'TodaysSpecial' as const, id: r.id })), { type: 'TodaysSpecial', id: 'LIST' }]
      }
    }),
    getActiveTodaysSpecials: builder.query<TodaysSpecialItem[], void>({
      query: () => 'todays-specials?active=true',
      transformResponse: (response: any) => {
        console.log('getActiveTodaysSpecials raw response:', response)
        // Handle different response structures
        if (Array.isArray(response)) {
          return response
        }
        if (response && Array.isArray(response.data)) {
          return response.data
        }
        if (response && Array.isArray(response.items)) {
          return response.items
        }
        if (response && Array.isArray(response.specials)) {
          return response.specials
        }
        if (response && Array.isArray(response.todaysSpecials)) {
          return response.todaysSpecials
        }
        console.warn('Unexpected response structure for active todays specials:', response)
        return []
      },
      providesTags: [{ type: 'TodaysSpecial', id: 'ACTIVE' }]
    }),
    getTodaysSpecialById: builder.query<TodaysSpecialItem, string>({
      query: (id) => `todays-specials/${id}`,
      transformResponse: (response: any) => {
        console.log('getTodaysSpecialById raw response:', response)
        // Handle different response structures
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // If response has data, item, or special property, use that
          if (response.data) return response.data
          if (response.item) return response.item
          if (response.special) return response.special
          if (response.todaysSpecial) return response.todaysSpecial
          // Otherwise assume the response itself is the item
          return response
        }
        return response
      },
      providesTags: (result, error, id) => [{ type: 'TodaysSpecial', id }]
    }),
    createTodaysSpecial: builder.mutation<TodaysSpecialItem, CreateTodaysSpecialInput>({
      query: (body) => ({ url: 'todays-specials', method: 'POST', body }),
      invalidatesTags: [{ type: 'TodaysSpecial', id: 'LIST' }, { type: 'TodaysSpecial', id: 'ACTIVE' }]
    }),
    updateTodaysSpecial: builder.mutation<TodaysSpecialItem, UpdateTodaysSpecialInput>({
      query: ({ id, ...patch }) => ({ url: `todays-specials/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (result, error, arg) => [
        { type: 'TodaysSpecial', id: arg.id },
        { type: 'TodaysSpecial', id: 'LIST' },
        { type: 'TodaysSpecial', id: 'ACTIVE' }
      ]
    }),
    deleteTodaysSpecial: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({ url: `todays-specials/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'TodaysSpecial', id },
        { type: 'TodaysSpecial', id: 'LIST' },
        { type: 'TodaysSpecial', id: 'ACTIVE' }
      ]
    })
  })
})

export const {
  // Special Offers
  useGetSpecialOffersQuery,
  useGetActiveSpecialOffersQuery,
  useGetSpecialOfferByIdQuery,
  useCreateSpecialOfferMutation,
  useUpdateSpecialOfferMutation,
  useDeleteSpecialOfferMutation,
  
  // Today's Specials
  useGetTodaysSpecialsQuery,
  useGetActiveTodaysSpecialsQuery,
  useGetTodaysSpecialByIdQuery,
  useCreateTodaysSpecialMutation,
  useUpdateTodaysSpecialMutation,
  useDeleteTodaysSpecialMutation
} = offersApi
