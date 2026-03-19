import { Card, CardContent, CardHeader, CardTitle } from "@zayka/ui"
import { Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Items",
    value: "0",
    icon: Package,
    description: "inventory items tracked",
  },
  {
    title: "Low Stock Alerts",
    value: "0",
    icon: AlertTriangle,
    description: "items below threshold",
    className: "text-destructive",
  },
  {
    title: "Total Inventory Value",
    value: "₹0",
    icon: DollarSign,
    description: "current stock value",
  },
  {
    title: "Items Restocked",
    value: "0",
    icon: TrendingUp,
    description: "this month",
  },
]

export default function DashboardPage() {
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
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.className ?? ""}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Expiries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No items expiring soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
