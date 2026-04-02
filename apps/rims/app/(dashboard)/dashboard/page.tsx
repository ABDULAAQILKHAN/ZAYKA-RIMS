"use client"

import { Card, CardContent, CardHeader, CardTitle, Badge } from "@zayka/ui"
import { formatCurrency } from "@zayka/utils"
import { Package, AlertTriangle, DollarSign, ShoppingCart } from "lucide-react"
import { useGetIngredientsQuery, useGetOrdersQuery, useGetInvoicesQuery } from "@/store/api"

export default function DashboardPage() {
  const { data: rawIngredients } = useGetIngredientsQuery()
  const { data: rawOrders } = useGetOrdersQuery()
  const { data: rawInvoices } = useGetInvoicesQuery()

  const ingredients = Array.isArray(rawIngredients) ? rawIngredients : []
  const orders = Array.isArray(rawOrders) ? rawOrders : []
  const invoices = Array.isArray(rawInvoices) ? rawInvoices : []

  const lowStock = ingredients.filter((i) => i.currentStock <= i.minStock)
  const totalValue = ingredients.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0)
  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status))
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0)

  const stats = [
    { title: "Total Ingredients", value: String(ingredients.length), icon: Package, description: "items tracked" },
    { title: "Low Stock Alerts", value: String(lowStock.length), icon: AlertTriangle, description: "below threshold", className: lowStock.length > 0 ? "text-destructive" : "" },
    { title: "Inventory Value", value: formatCurrency(totalValue), icon: DollarSign, description: "current stock value" },
    { title: "Active Orders", value: String(activeOrders.length), icon: ShoppingCart, description: "in progress" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your restaurant inventory and operations.
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
              <div className={`text-2xl font-bold ${stat.className ?? ""}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All stock levels are healthy.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lowStock.map((item) => (
                  <Badge key={item.id} variant="destructive">
                    {item.name}: {item.currentStock} {item.unit}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
            <p className="text-xs text-muted-foreground">from paid invoices</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
