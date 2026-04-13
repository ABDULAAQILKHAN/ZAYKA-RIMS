"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@zayka/ui"
import { AlertTriangle, DollarSign, Package, ShoppingCart } from "lucide-react"
import { useGetDashboardStatsQuery } from "@/store/api"

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardStatsQuery()

  const stats = [
    {
      title: "Total Ingredients",
      value: data?.total_ingredients ?? 0,
      icon: Package,
      description: "tracked inventory records",
    },
    {
      title: "Low Stock Alerts",
      value: data?.low_stock_count ?? 0,
      icon: AlertTriangle,
      description: "ingredients below minimum stock",
    },
    {
      title: "Total Orders",
      value: data?.total_orders ?? 0,
      icon: ShoppingCart,
      description: "orders processed",
    },
    {
      title: "Revenue",
      value: `INR ${data?.total_revenue ?? 0}`,
      icon: DollarSign,
      description: "from completed billing totals",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Live snapshot of inventory and order operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
