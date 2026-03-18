"use client"
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import { ReactNode, useEffect } from 'react'
import { loadToken } from '@/store/authSlice'

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Load token from localStorage once on mount (client side only)
    store.dispatch(loadToken())
  }, [])
  return <Provider store={store}>{children}</Provider>
}
