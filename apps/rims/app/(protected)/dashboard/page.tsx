"use client"

import { useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zayka/ui"
import {
  useGetInsightsQuery,
  useGetOrdersQuery,
  useGetTableSessionsQuery,
  useGetTablesQuery,
  type InsightsPeriod,
} from "@/store/api"

export default function DashboardPage() {
  const { data: tables = [], isLoading: tablesLoading } = useGetTablesQuery()
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery()
  const { data: sessions = [] } = useGetTableSessionsQuery()

  const [period, setPeriod] = useState<InsightsPeriod>("week")
  const { data: insights, isLoading: insightsLoading } = useGetInsightsQuery({ period })

  const occupiedTables = tables?.length > 0 ? tables.filter((t) => t.status === "occupied") : []
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRevenue = insights?.daily_revenue?.find((d) => d.date === todayStr)?.revenue ?? 0

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Real-time overview of tables, orders, and business insights.
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tables</CardDescription>
            <CardTitle className="text-3xl">{tablesLoading ? "…" : (tables?.length ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {occupiedTables.length} occupied · {(tables?.length ?? 0) - occupiedTables.length} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Orders</CardDescription>
            <CardTitle className="text-3xl">{ordersLoading ? "…" : (orders?.length ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {orders?.length > 0 ? orders.filter((o) => o.order_type === "table").length : 0} table ·{" "}
              {orders?.length > 0 ? orders.filter((o) => o.order_type === "takeaway").length : 0} takeaway 
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Sessions</CardDescription>
            <CardTitle className="text-3xl">{sessions?.length > 0 ? sessions.length : 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tables being served right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Revenue</CardDescription>
            <CardTitle className="text-3xl">₹{insightsLoading ? "…" : (todayRevenue ?? 0).toFixed(0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              From all order types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Active Tables ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Active Tables</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tables?.length > 0 && tables.map((table) => {
            const tableSession = sessions?.find((s) => s.table_id === table.id)
            return (
              <Card key={table.id} className={table.status === "occupied" ? "border-primary/40" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{table.table_number}</CardTitle>
                    <Badge variant={table.status === "occupied" ? "default" : "outline"}>
                      {table.status}
                    </Badge>
                  </div>
                  {table.capacity ? (
                    <CardDescription>Seats {table.capacity}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-1">
                  {tableSession ? (
                    <>
                      <p className="text-sm">
                        Orders: <span className="font-medium">{tableSession.orders?.length ?? 0}</span>
                      </p>
                      <p className="text-sm">
                        Running total: <span className="font-semibold">₹{(tableSession.total ?? 0).toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Session since {tableSession.created_at ? new Date(tableSession.created_at).toLocaleTimeString() : "N/A"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active session</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {tablesLoading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Loading tables...</CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {/* ── Active Orders ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Active Orders</h2>
        <div className="space-y-3">
          {(orders?.length === 0 && !ordersLoading) ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No active orders at the moment.
              </CardContent>
            </Card>
          ) : null}
          {orders?.length > 0 && orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    Order #{order.id}
                    {order.session_id ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Session {order.session_id}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.order_type === "table"
                      ? `Table ${order.table_number ?? "-"}`
                      : order.order_type === "takeaway"
                      ? "Takeaway"
                      : "Delivery"}{" "}
                    · ₹{(order.total ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.items?.map((i: any) => `${i.menu_item_name} x${i.quantity}`).join(", ") ?? ""}
                  </p>
                </div>
                <Badge variant="outline">{order.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {ordersLoading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Loading active orders...</CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {/* ── Insights ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Insights</h2>
          <div className="flex gap-2">
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("week")}
            >
              This Week
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              This Month
            </Button>
          </div>
        </div>

        {insightsLoading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading insights...</CardContent>
          </Card>
        ) : insights ? (
          <>
            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Revenue</CardDescription>
                  <CardTitle className="text-2xl">₹{(insights.total_revenue ?? 0).toFixed(2)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Orders</CardDescription>
                  <CardTitle className="text-2xl">{insights.total_orders ?? 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg. Order Value</CardDescription>
                  <CardTitle className="text-2xl">₹{(insights.average_order_value ?? 0).toFixed(2)}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Order Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(["table", "takeaway", "delivery"] as const).map((type) => {
                    const breakdown = insights.order_type_breakdown ?? {}
                    const count = breakdown[type] ?? 0
                    const maxCount = Math.max(
                      breakdown.table ?? 0,
                      breakdown.takeaway ?? 0,
                      breakdown.delivery ?? 0,
                      1,
                    )
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Top Menu Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Menu Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!insights.top_items || insights.top_items.length === 0) ? (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  ) : null}
                  {insights.top_items?.map((item, idx) => {
                    const maxRevenue = insights.top_items?.[0]?.revenue || 1
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                            {item.name}
                            <span className="ml-1 text-muted-foreground">x{item.quantity}</span>
                          </span>
                          <span className="font-medium">₹{item.revenue}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Table Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Table Utilization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!insights.table_utilization || insights.table_utilization.length === 0) ? (
                    <p className="text-sm text-muted-foreground">No session data available</p>
                  ) : null}
                  {insights.table_utilization?.map((t) => (
                    <div key={t.table_number} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <span className="font-medium">{t.table_number}</span>
                      <span>
                        {t.session_count} session{t.session_count !== 1 ? "s" : ""} · ₹{(t.total_revenue ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Daily Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(insights.daily_revenue?.filter((d) => d.order_count > 0).length === 0) ? (
                    <p className="text-sm text-muted-foreground">No revenue data for this period</p>
                  ) : null}
                  {insights.daily_revenue
                    ?.filter((d) => d.order_count > 0)
                    .slice(-7)
                    .map((d) => {
                      const maxRev = Math.max(...(insights.daily_revenue?.map((dr) => dr.revenue) ?? []), 1)
                      return (
                        <div key={d.date} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="font-medium">
                              ₹{(d.revenue ?? 0).toFixed(0)} ({d.order_count} orders)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${(d.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}