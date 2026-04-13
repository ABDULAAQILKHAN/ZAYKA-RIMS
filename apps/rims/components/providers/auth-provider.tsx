"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/services/supabase"
import { getRoleFromUserMetadata } from "@/lib/auth"
import { clearToken, setToken } from "@/store/auth-slice"
import { useAppDispatch } from "@/store/hooks"
import type { RimsRole } from "@/types"

interface AuthContextValue {
  user: User | null
  role: RimsRole | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function resolveRole(user: User | null): Promise<RimsRole | null> {
  if (!user) {
    return null
  }

  const metadataRole = getRoleFromUserMetadata(user)
  if (metadataRole) {
    return metadataRole as RimsRole
  }

  const supabase = createClient()
  const byUserId = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (byUserId.data?.role) {
    return byUserId.data.role as RimsRole
  }

  const byId = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
  if (byId.data?.role) {
    return byId.data.role as RimsRole
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<RimsRole | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAuth = async () => {
    const supabase = createClient()

    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        throw sessionError
      }

      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)

      if (data.session?.access_token) {
        dispatch(setToken(data.session.access_token))
      } else {
        dispatch(clearToken())
      }

      const resolvedRole = await resolveRole(data.session?.user ?? null)
      setRole(resolvedRole)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize auth"
      setError(message)
      setSession(null)
      setUser(null)
      setRole(null)
      dispatch(clearToken())
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setSession(null)
    setError(null)
    dispatch(clearToken())
  }

  useEffect(() => {
    const supabase = createClient()
    refreshAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.access_token) {
        dispatch(setToken(nextSession.access_token))
      } else {
        dispatch(clearToken())
      }

      const resolvedRole = await resolveRole(nextSession?.user ?? null)
      setRole(resolvedRole)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch])

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
