"use client"

import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zayka/ui"
import {
  useGetInsightsQuery,
  useGetOrdersQuery,
  useGetTableSessionsQuery,
  useGetTablesQuery,
  type InsightsPeriod,
} from "@/store/api"

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: tables = [], isLoading: tablesLoading } = useGetTablesQuery()
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery()
  const { data: sessions = [] } = useGetTableSessionsQuery()

  const [period, setPeriod] = useState<InsightsPeriod>("week")
  const { data: insights, isLoading: insightsLoading } = useGetInsightsQuery({ period })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const occupiedTables = tables?.length > 0 ? tables.filter((t) => t.status === "occupied") : []
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRevenue = insights?.dailyRevenue?.find((d) => d.date === todayStr)?.revenue ?? 0

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Real-time overview of tables, orders, and business insights.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live">Live Operations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                  {orders?.length > 0 ? orders.filter((o) => o.orderType === "table").length : 0} table ·{" "}
                  {orders?.length > 0 ? orders.filter((o) => o.orderType === "takeaway").length : 0} takeaway
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

          <Card>
            <CardHeader>
              <CardTitle>Welcome to Dashboard</CardTitle>
              <CardDescription>Get a quick glance at your restaurant's performance today.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select the Live Operations tab to view active tables and orders, or Insights for detailed analytics.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-8">

          {/* ── Active Tables ── */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Active Tables</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {tables?.length > 0 && tables.map((table) => {
                const tableSession = sessions?.find((s) => s.tableId === table.id)
                return (
                  <Card key={table.id} className={table.status === "occupied" ? "border-primary/40" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{table.tableNumber}</CardTitle>
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
                            Session since {tableSession.createdAt ? new Date(tableSession.createdAt).toLocaleTimeString() : "N/A"}
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
                        {order.sessionId ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Session {order.sessionId}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.orderType === "table"
                          ? `Table ${order.tableNumber ?? "-"}`
                          : order.orderType === "takeaway"
                            ? "Takeaway"
                            : "Delivery"}{" "}
                        · ₹{(order.total ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.map((i: any) => `${i?.menuItemName ?? "Unknown"} x${i?.quantity ?? 0}`).join(", ") ?? ""}
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
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
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
                      <CardTitle className="text-2xl">₹{(insights.totalRevenue ?? 0).toFixed(2)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Orders</CardDescription>
                      <CardTitle className="text-2xl">{insights.totalOrders ?? 0}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Avg. Order Value</CardDescription>
                      <CardTitle className="text-2xl">₹{(insights.averageOrderValue ?? 0).toFixed(2)}</CardTitle>
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
                        const breakdown = insights.orderTypeBreakdown ?? {}
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
                      {(!insights.topItems || insights.topItems.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No data available</p>
                      ) : null}
                      {insights.topItems?.map((item, idx) => {
                        const maxRevenue = insights.topItems?.[0]?.revenue || 1
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
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
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
                      {(!insights.tableUtilization || !Array.isArray(insights.tableUtilization) || insights.tableUtilization.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No session data available</p>
                      ) : null}
                      {(Array.isArray(insights.tableUtilization) ? insights.tableUtilization : [])?.map((t) => (
                        <div key={t.tableNumber} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                          <span className="font-medium">{t.tableNumber}</span>
                          <span>
                            {t.sessionCount} session{t.sessionCount !== 1 ? "s" : ""} · ₹{(t.totalRevenue ?? 0).toFixed(2)}
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
                      {(insights.dailyRevenue?.filter((d) => d.orderCount > 0).length === 0) ? (
                        <p className="text-sm text-muted-foreground">No revenue data for this period</p>
                      ) : null}
                      {insights.dailyRevenue
                        ?.filter((d) => d.orderCount > 0)
                        .slice(-7)
                        .map((d) => {
                          const maxRev = Math.max(...(insights.dailyRevenue?.map((dr) => dr.revenue) ?? []), 1)
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
                                  ₹{(d.revenue ?? 0).toFixed(0)} ({d.orderCount} orders)
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
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load insights.</p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
