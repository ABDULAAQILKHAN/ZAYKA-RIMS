"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const data = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      if (!data.profile) return
      try {
        if (data?.error) {
          return
        }
        if (data?.profile?.isDark !== undefined) {
          setTheme(data.profile.isDark ? "dark" : "light")
        }
      } catch (err: any) {
        toast.error(err.message || 'An unexpected error occurred while fetching user theme');
      } finally {
      }
    }
    fetchUser()
  }, [data])
  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    try {
      if (!data.user) return
      const { error } = await supabase.auth.updateUser({
        data: {
          isDark: newTheme === "dark"
        }
      })
      if (error) {
        toast.error("Failed to update theme preference")
        return
      }

      //data.refreshProfile()
      toast.success("Theme preference updated successfully!")
    } catch (error) {
      toast.error("An unexpected error occurred while updating theme")
    }
  }
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
