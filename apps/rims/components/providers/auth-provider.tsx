"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { clearToken, setToken } from "@/store/auth-slice"
import { useAppDispatch } from "@/store/hooks"

type SessionUser = {
  id: string
  email: string
}

type SessionRole = "admin" | "manager" | null

type SessionShape = {
  access_token: string
  user: SessionUser
  role: Exclude<SessionRole, null>
}

interface AuthContextValue {
  user: SessionUser | null
  role: SessionRole
  session: SessionShape | null
  isLoading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readSessionFromStorage(): SessionShape | null {
  if (typeof window === "undefined") {
    return null
  }

  const token = localStorage.getItem("access_token")
  const userRaw = localStorage.getItem("rims_user")
  const roleRaw = localStorage.getItem("rims_role")

  if (!token || !userRaw || !roleRaw) {
    return null
  }

  try {
    const user = JSON.parse(userRaw) as SessionUser
    if (!user?.id || !user?.email) {
      return null
    }

    if (roleRaw !== "admin" && roleRaw !== "manager") {
      return null
    }

    return {
      access_token: token,
      user,
      role: roleRaw,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [role, setRole] = useState<SessionRole>(null)
  const [session, setSession] = useState<SessionShape | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAuth = async () => {
    const stored = readSessionFromStorage()

    if (!stored) {
      setUser(null)
      setRole(null)
      setSession(null)
      setError(null)
      dispatch(clearToken())
      setIsLoading(false)
      return
    }

    setUser(stored.user)
    setRole(stored.role)
    setSession(stored)
    setError(null)
    dispatch(setToken(stored.access_token))
    setIsLoading(false)
  }

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rims_user")
      localStorage.removeItem("rims_role")
    }

    setUser(null)
    setRole(null)
    setSession(null)
    setError(null)
    dispatch(clearToken())
  }

  useEffect(() => {
    refreshAuth()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      session,
      isLoading,
      error,
      signOut,
      refreshAuth,
    }),
    [error, isLoading, role, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
