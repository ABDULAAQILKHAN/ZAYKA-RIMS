"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useAppDispatch } from '@/store/hooks'
import { setToken } from '@/store/authSlice'
import { useCreateProfileMutation } from '@/store/profileApi'
// import { useAuth } from "@/components/providers/auth-provider"
import toast from "react-hot-toast"

interface FormData {
  email: string
  password: string
}

interface ValidationErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const router = useRouter()
  // const { refreshProfile } = useAuth()
  const supabase = createClient()
  const dispatch = useAppDispatch()
  const [createProfile] = useCreateProfileMutation()

  // Handle invite/magic link tokens in URL hash
  useEffect(() => {
    const handleTokensInHash = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type') // 'invite', 'magiclink', 'recovery', etc.
      const errorCode = hashParams.get('error_code')
      const errorDescription = hashParams.get('error_description')

      // Handle error in URL
      if (errorCode) {
        const message = errorDescription?.replace(/\+/g, ' ') || 'Authentication failed'
        toast.error(message)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      // If we have tokens, handle them based on type
      if (accessToken && refreshToken) {
        try {
          // For invite type, redirect to reset-password so staff can set their password
          if (type === 'invite') {
            // Redirect to reset-password with the tokens preserved in hash
            router.push(`/auth/reset-password${window.location.hash}`)
            return
          }

          // For other types (magiclink, recovery), set session and redirect
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            toast.error(error.message)
            window.history.replaceState({}, document.title, window.location.pathname)
            return
          }

          if (data.session) {
            // Store token in Redux
            dispatch(setToken(data.session.access_token))

            // Get user role and redirect accordingly
            const role = data.session.user.user_metadata?.role || 'customer'
            toast.success('Logged in successfully!')
            console.log('User role:', role)
            if (role === 'admin') {
              router.push('/admin')
            } else if (role === 'staff') {
              router.push('/staff/menu')
            } else {
              router.push('/menu')
            }
          }
        } catch (error) {
          console.error('Error handling auth tokens:', error)
          toast.error('Authentication failed. Please try again.')
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }

    handleTokensInHash()
  }, [supabase.auth, dispatch, router])

  // Email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required"
        return !emailRegex.test(value) ? "Please enter a valid email address" : undefined
      case "password":
        if (!value) return "Password is required"
        return value.length < 6 ? "Password must be at least 6 characters" : undefined
      default:
        return undefined
    }
  }

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        newErrors[fieldName] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors below")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error("Login error:", error)
        toast.error(error.message || "Failed to login")
        return
      }

      if (data.user && data.session) {
        toast.success("Login successful! Welcome back to Zayka!")

        // Save access token for subsequent API calls
        const accessToken = data.session.access_token
        if (accessToken) {
          dispatch(setToken(accessToken))
        }

        // Attempt to create/update profile (backend should upsert ideally)
        try {
          await createProfile({
            id: data.user.id,
            userId: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || formData.email,
            phone: data.user.user_metadata?.phone || '',
            avatar: data.user.user_metadata?.avatar_url || '',
            isDark: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).unwrap()
        } catch (e: any) {
          if (e.status !== 409) {
            console.warn('Profile creation failed (non-blocking):', e.status)
            return
          }
        }

        const userRole = data.user.user_metadata?.role || 'customer'

        // Conditional routing based on role
        if (userRole === 'customer') {
          router.push("/menu")
        } else if (userRole === 'admin') {
          router.push("/admin")
        } else if (userRole === 'staff') {
          router.push("/staff/menu")
        } else if (userRole === 'manager') {
          router.push("/manager/orders")
        } else if (userRole === 'rider') {
          router.push("/rider")
        } else {
          // Default fallback
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-zayka-600 dark:text-zayka-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
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
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-zayka-600 dark:text-zayka-400 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
