"use client"

import { type ReactNode, useEffect } from "react"
import { Provider } from "react-redux"
import { loadToken } from "@/store/auth-slice"
import { store } from "@/store/store"

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(loadToken())
  }, [])

  return <Provider store={store}>{children}</Provider>
}
