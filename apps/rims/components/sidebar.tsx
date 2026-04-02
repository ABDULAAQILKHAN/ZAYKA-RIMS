"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@zayka/ui"
import { Button } from "@zayka/ui"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Menu Management", href: "/menu", icon: UtensilsCrossed },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Billing / Invoices", href: "/billing", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, signOut } = useAuth()

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

      <div className="border-t p-4 space-y-3">
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zayka Darbar
        </p>
      </div>
    </aside>
  )
}
