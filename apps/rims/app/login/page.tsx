"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zayka/ui"
import { createClient } from "@zayka/auth/client"
import { useAppDispatch } from "@/store/hooks"
import { setToken } from "@/store/authSlice"
import type { UserRole } from "@zayka/types"
import toast from "react-hot-toast"

const ALLOWED_ROLES: UserRole[] = ["desk-manager", "manager", "admin"]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)

  const router = useRouter()
  const supabase = createClient()
  const dispatch = useAppDispatch()

  // If already logged in with valid role, redirect
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const role = user.user_metadata?.role as UserRole | undefined
        if (role && ALLOWED_ROLES.includes(role)) {
          router.replace("/dashboard")
          return
        }
      }
      setCheckingSession(false)
    }
    check()
  }, [supabase.auth, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!data.user || !data.session) {
        setError("Login failed. Please try again.")
        return
      }

      const userRole = data.user.user_metadata?.role as UserRole | undefined

      if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
        // Unauthorized role → sign out immediately
        await supabase.auth.signOut()
        setError("Unauthorized access. Only managers and admins can access RIMS.")
        return
      }

      dispatch(setToken(data.session.access_token))
      toast.success("Login successful!")
      router.push("/dashboard")
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Zayka</h1>
          <span className="inline-block mt-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            RIMS
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            Restaurant Inventory Management System
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@zayka.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
