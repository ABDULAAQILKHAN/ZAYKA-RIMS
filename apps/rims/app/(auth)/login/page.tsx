"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@zayka/ui"
import { createClient } from "@zayka/auth/client"
import { useAppDispatch } from "@/store/hooks"
import { setToken } from "@/store/auth-slice"
import toast from "react-hot-toast"

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle tokens in URL hash (for invite/magic links)
  useEffect(() => {
    const handleTokensInHash = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        try {
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
            dispatch(setToken(data.session.access_token))
            const role = data.session.user.user_metadata?.role || 'staff'
            toast.success('Logged in successfully!')
            
            if (role === 'admin' || role === 'manager' || role === 'staff') {
              router.push('/dashboard')
            } else {
              setError("Unauthorized access: Incorrect role")
              await supabase.auth.signOut()
            }
          }
        } catch (err) {
          console.error('Auth error:', err)
        }
      }
    }

    handleTokensInHash()
  }, [supabase, dispatch, router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error") === "unauthorized") {
      setError("Unauthorized access")
    }
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        const role = data.session.user.user_metadata?.role || 'staff'
        
        // RIMS is for admin, manager, and staff
        if (role === 'admin' || role === 'manager' || role === 'staff') {
          dispatch(setToken(data.session.access_token))
          toast.success('Logged in successfully!')
          router.push("/dashboard")
        } else {
          setError("Unauthorized access: Incorrect role")
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      setError("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">RIMS Login</CardTitle>
          <CardDescription>
            Sign in with your authorized desk manager account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="manager@zayka.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
