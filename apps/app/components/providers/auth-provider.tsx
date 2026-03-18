"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useAppDispatch } from "@/store/hooks"
import { setToken, clearToken } from "@/store/authSlice"

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  phone?: string
  role?: string
  image?: string
  imagePath?: string
  isDark?: boolean
}

interface AuthContextType {
  user: User | null
  error: any
  profile: UserProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const supabase = createClient()
  const dispatch = useAppDispatch()
  const fetchProfile = async (currentUser: User): Promise<UserProfile | null> => {
    try {
      return {
        id: currentUser.id,
        email: currentUser.email!,
        first_name: currentUser.user_metadata?.first_name,
        last_name: currentUser.user_metadata?.last_name,
        full_name: currentUser.user_metadata?.full_name,
        phone: currentUser.user_metadata?.phone,
        role: currentUser.user_metadata?.role || 'customer',
        image: currentUser.user_metadata?.image,
        imagePath: currentUser.user_metadata?.imagePath,
        isDark: currentUser.user_metadata?.isDark,
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user)
      setProfile(profileData)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    dispatch(clearToken())
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error} = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user)
          setProfile(profileData)
          // Sync token to Redux for CartInitializer
          dispatch(setToken(session.access_token))
        } else {
          console.log('No user session found')
          dispatch(clearToken())
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user)
          setProfile(profileData)
          // Sync token to Redux for CartInitializer
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
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        error,
        profile, 
        isLoading, 
        signOut, 
        refreshProfile 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
