"use client"

import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@zayka/ui"
import { useGetDashboardStatsQuery, useGetIngredientsQuery, useGetOrdersQuery } from "@/store/api"

export default function ReportsPage() {
  const { data: stats } = useGetDashboardStatsQuery()
  const { data: ingredients } = useGetIngredientsQuery()
  const { data: orders } = useGetOrdersQuery()

  const lowStockItems = (ingredients ?? []).filter(
    (ingredient) => ingredient.current_stock <= ingredient.min_stock,
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">Sales, inventory, and operational summaries.</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Total orders: {stats?.total_orders ?? 0}</p>
              <p>Total revenue: INR {stats?.total_revenue ?? 0}</p>
              <p>
                Delivered orders:{" "}
                {(orders ?? []).filter((order) => order.status === "delivered").length}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Total ingredients: {stats?.total_ingredients ?? 0}</p>
              <p>Low stock count: {stats?.low_stock_count ?? 0}</p>
              <p>
                Items low on stock:{" "}
                {lowStockItems.length > 0
                  ? lowStockItems.map((item) => item.name).join(", ")
                  : "None"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Operational Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Order placement auto-deducts ingredient stock.</p>
              <p>Menu item availability recalculates after stock changes and orders.</p>
              <p>Invoices can be generated for delivered orders from Billing.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
