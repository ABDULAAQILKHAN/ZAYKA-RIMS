"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthorized, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Not authenticated → redirect to login
    if (!user) {
      router.replace("/login")
      return
    }

    // Authenticated but unauthorized role → sign out
    if (!isAuthorized) {
      signOut()
      return
    }

    // Authenticated + authorized on /login → redirect to dashboard
    if (pathname === "/login") {
      router.replace("/dashboard")
    }
  }, [user, loading, isAuthorized, pathname, router, signOut])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // On /login page, let through (LoginPage handles its own redirect)
  if (pathname === "/login") {
    return null
  }

  if (!user || !isAuthorized) {
    return null
  }

  return <>{children}</>
}
