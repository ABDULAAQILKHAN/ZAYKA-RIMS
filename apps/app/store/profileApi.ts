import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface ProfilePayload {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  avatar: string
  isDark: boolean
  createdAt: string
  updatedAt: string
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers: Headers, { getState }: any) => {
      const state = getState() as { auth?: { token?: string | null } }
      const token = state?.auth?.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    createProfile: builder.mutation<ProfilePayload, ProfilePayload>({
      query: (body) => ({ url: 'profile', method: 'POST', body }),
      invalidatesTags: ['Profile']
    })
  })
})

export const { useCreateProfileMutation } = profileApi
