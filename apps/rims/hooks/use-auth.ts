"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@zayka/auth/client"
import type { User } from "@supabase/supabase-js"
import type { UserRole } from "@zayka/types"

const ALLOWED_ROLES: UserRole[] = ["desk-manager", "manager", "admin"]

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const userRole = (user.user_metadata?.role as UserRole) ?? null
        setUser(user)
        setRole(userRole)
      } else {
        setUser(null)
        setRole(null)
      }
    } catch {
      setUser(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setRole((session.user.user_metadata?.role as UserRole) ?? null)
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchUser, supabase.auth])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    router.push("/login")
  }, [supabase.auth, router])

  const isAuthorized = role !== null && ALLOWED_ROLES.includes(role)

  return { user, role, loading, isAuthorized, signOut, refetch: fetchUser }
}
