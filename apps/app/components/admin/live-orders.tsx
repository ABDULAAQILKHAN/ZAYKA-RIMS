"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, CheckCircle, Truck, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation, type Order } from "@/store/ordersApi"
import { formatCurrency, formatOrderDate } from "@/lib/utils"
import { toast } from "sonner"

type OrderStatus = "pending" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled"

const statusConfig: Record<OrderStatus, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: "bg-yellow-500", icon: AlertCircle, label: "Pending" },
  preparing: { color: "bg-blue-500", icon: Clock, label: "Preparing" },
  ready: { color: "bg-green-500", icon: CheckCircle, label: "Ready" },
  "out-for-delivery": { color: "bg-purple-500", icon: Truck, label: "Out for Delivery" },
  delivered: { color: "bg-gray-500", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-red-500", icon: AlertCircle, label: "Cancelled" },
}

export default function LiveOrders() {
  const { data: orders = [], isLoading, isFetching } = useGetAllOrdersQuery(undefined, {
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredOrders = orders.filter((order) => filterStatus === "all" || order.status === filterStatus)

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus }).unwrap()
      toast.success(`Order ${orderId} status updated to ${newStatus}`)
    } catch (error) {
      toast.error("Failed to update order status")
    }
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: "preparing",
      preparing: "ready",
      ready: "out-for-delivery",
      "out-for-delivery": "delivered",
      delivered: null,
      cancelled: null,
    }
    return statusFlow[currentStatus]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Orders</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track current orders
            {isFetching && <span className="ml-2 text-xs">(Refreshing...)</span>}
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).filter(([status]) => status !== 'cancelled').map(([status, config]) => {
          const count = orders.filter((order) => order.status === status).length
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Orders List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {filteredOrders.map((order) => {
          const config = statusConfig[order.status as OrderStatus] || statusConfig.pending
          const nextStatus = getNextStatus(order.status as OrderStatus)
          const { date, time } = formatOrderDate(order.createdAt)

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{order.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Customer Details</h4>
                      <p className="text-sm">{order.customerName || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{order.address || 'No address'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Order Items</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      <p>Ordered: {date} at {time}</p>
                    </div>
                    {nextStatus && order.status !== 'cancelled' && (
                      <Button onClick={() => handleUpdateStatus(order.id, nextStatus)} size="sm">
                        Mark as {statusConfig[nextStatus].label}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found for the selected filter.</p>
        </div>
      )}
    </div>
  )
}
