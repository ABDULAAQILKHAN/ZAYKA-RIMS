"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button, cn } from "@zayka/ui"
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  BarChart3,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Menu Management", href: "/menu", icon: UtensilsCrossed },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Billing / Invoices", href: "/billing", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const onSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Zayka</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            RIMS
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          type="button"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
        <p className="text-xs text-muted-foreground">(c) {new Date().getFullYear()} Zayka Darbar</p>
      </div>
    </aside>
  )
}
