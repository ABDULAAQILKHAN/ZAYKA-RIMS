"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@zayka/auth/client"
import type { User } from "@supabase/supabase-js"
import { useAppDispatch } from "@/store/hooks"
import { setToken, clearToken } from "@/store/auth-slice"

interface UserProfile {
  id: string
  email: string
  role?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: any
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const supabase = createClient()
  const dispatch = useAppDispatch()

  const fetchProfile = (currentUser: User): UserProfile => {
    return {
      id: currentUser.id,
      email: currentUser.email!,
      role: currentUser.user_metadata?.role || 'staff',
    }
  }

  const refreshAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        setUser(session.user)
        setProfile(fetchProfile(session.user))
        dispatch(setToken(session.access_token))
      } else {
        setUser(null)
        setProfile(null)
        dispatch(clearToken())
      }
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    dispatch(clearToken())
  }

  useEffect(() => {
    refreshAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setProfile(fetchProfile(session.user))
          dispatch(setToken(session.access_token))
        } else {
          setUser(null)
          setProfile(null)
          dispatch(clearToken())
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, dispatch])

  const value = {
    user,
    profile,
    isLoading,
    error,
    signOut,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
