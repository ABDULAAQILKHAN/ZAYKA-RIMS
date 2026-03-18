"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChefHat, ShoppingBag, Clock, DollarSign, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StaffManagement from "./staff-management"
import OrderManagement from "./order-management"
import { useGetDashboardStatsQuery, useGetRecentOrdersQuery } from "@/store/dashboardApi"
import { formatCurrency, formatOrderDate } from "@/lib/utils"
import { useAppSelector } from "@/store/hooks"

export default function AdminDashboard() {
  const token = useAppSelector((state) => state.auth.token)
  
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute for stats
    skip: !token
  })
  const { data: recentOrders = [], isLoading: ordersLoading } = useGetRecentOrdersQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds for recent orders
    skip: !token
  })

  const stats = [
    {
      title: "Total Orders Today",
      value: statsLoading ? "..." : (statsData?.totalOrdersToday || 0).toString(),
      change: statsLoading ? "..." : `${statsData?.totalOrdersComparePercentage && statsData.totalOrdersComparePercentage > 0 ? '+' : ''}${statsData?.totalOrdersComparePercentage || 0}%`,
      icon: ShoppingBag,
      color: "text-blue-600",
      changeLabel: "from yesterday"
    },
    {
      title: "Revenue Today",
      value: statsLoading ? "..." : formatCurrency(statsData?.revenueToday || 0),
      change: statsLoading ? "..." : `${statsData?.revenueComparePercentage && statsData.revenueComparePercentage > 0 ? '+' : ''}${statsData?.revenueComparePercentage || 0}%`,
      icon: DollarSign,
      color: "text-green-600",
      changeLabel: "from yesterday"
    },
    {
      title: "Active Orders",
      value: statsLoading ? "..." : (statsData?.activeOrdersCount || 0).toString(),
      change: "Live",
      icon: Clock,
      color: "text-orange-600",
      changeLabel: ""
    },
    {
      title: "Menu Items",
      value: statsLoading ? "..." : (statsData?.totalMenuItems || 0).toString(),
      change: "Active",
      icon: ChefHat,
      color: "text-purple-600",
      changeLabel: ""
    },
  ]

  const quickActions = [
    {
      title: "Offers & Specials",
      description: "Manage special offers and today's specials",
      href: "/admin/offers",
      icon: Plus,
      color: "bg-zayka-600 hover:bg-zayka-700",
    },
    {
      title: "Manage Orders",
      description: "View and manage live orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Menu Management",
      description: "Edit existing menu items",
      href: "/admin/menu",
      icon: ChefHat,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Category Management",
      description: "Manage menu categories",
      href: "/admin/categories",
      icon: ShoppingBag,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'preparing': return 'default'
      case 'ready': return 'default'
      case 'out-for-delivery': return 'default'
      case 'delivered': return 'default'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening at Zayka today.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {/* <Button asChild>
            <Link href="/staff/orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
               View Live Orders
            </Link>
          </Button> */}
          <Button asChild>
            <Link href="/admin/menu">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <motion.div key={stat.title} variants={item}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={stat.change.includes('+') ? "text-green-600" : "text-muted-foreground"}>
                        {stat.change}
                      </span> {stat.changeLabel}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used admin functions</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Link key={action.title} href={action.href}>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50 w-full">
                        <action.icon className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Orders */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest 3 orders from customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ordersLoading ? (
                       <div className="text-center py-4 text-sm text-muted-foreground">Loading recent orders...</div>
                    ) : recentOrders.length === 0 ? (
                       <div className="text-center py-4 text-sm text-muted-foreground">No recent orders found.</div>
                    ) : (
                      recentOrders.length > 0 && recentOrders?.map((order) => (
                        <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <div className="font-medium">{order.customerName || "Walk-in Customer"}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.itemsSummary.join(", ")}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={getStatusColor(order.status) as any}>
                              {order.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                               {(() => {
                                  // Simplified time check
                                  const date = new Date(order.createdAt);
                                  const now = new Date();
                                  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                                  
                                  if (diffMins < 60) return `${diffMins} min ago`;
                                  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
                                  return date.toLocaleDateString();
                                })()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>
        <TabsContent value="staff">
          <StaffManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
