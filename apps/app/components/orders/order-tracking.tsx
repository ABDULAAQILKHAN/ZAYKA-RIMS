"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Clock, CheckCircle, Truck, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@zayka/ui"
import { Badge } from "@zayka/ui"
import { Input } from "@zayka/ui"
import { Button } from "@zayka/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zayka/ui"
import { formatOrderDate, formatCurrency } from "@zayka/utils"
import { useGetMyOrdersQuery, type Order } from "@/store/ordersApi"

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "preparing", label: "Preparing", icon: Clock },
  { key: "ready", label: "Ready", icon: CheckCircle },
  { key: "out-for-delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
]

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState("")
  const [pollingInterval, setPollingInterval] = useState(0)

  const { data: orders = [], isLoading } = useGetMyOrdersQuery(undefined, {
    pollingInterval,
  })

  useEffect(() => {
    const hasActiveOrders = orders.some(
      (order) => order.status !== "delivered" && order.status !== "cancelled"
    )
    setPollingInterval(hasActiveOrders ? 120000 : 0) // Poll every 2 minutes if there are active orders
  }, [orders])

  const activeOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled")
  const orderHistory = orders.filter((order) => order.status === "delivered" || order.status === "cancelled")

  const filteredActiveOrders = activeOrders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredHistoryOrders = orderHistory.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return <div className="text-center py-12">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Track Your Orders</h1>
        <p className="text-muted-foreground mt-2">Monitor your current orders and view order history</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order ID..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Order History ({orderHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredActiveOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No active orders found</p>
              <Button asChild>
                <a href="/menu">Order Now</a>
              </Button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {filteredActiveOrders.map((order) => (
                <OrderCard key={order.id} order={order} showProgress />
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {filteredHistoryOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No order history found</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {filteredHistoryOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  showProgress?: boolean
}

function OrderCard({ order, showProgress = false }: OrderCardProps) {
  const currentStatusIndex = getStatusIndex(order.status)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{order.id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const formatted = formatOrderDate(order.createdAt)
                  return `${formatted.date} at ${formatted.time}`
                })()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{formatCurrency(order.total)}</p>
              {order.estimatedCompletionTime && <p className="text-sm text-muted-foreground">ETA: {new Date(order.estimatedCompletionTime).toLocaleTimeString()}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-2">Items Ordered</h4>
            <div className="space-y-1">
              {order.items?.length > 0 && order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h4 className="font-medium mb-1">Delivery Address</h4>
            <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
          </div>

          {/* Progress Tracker */}
          {showProgress && (
            <div>
              <h4 className="font-medium mb-3">Order Progress</h4>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex
                  const StepIcon = step.icon

                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isCompleted ? "bg-zayka-600 text-white" : "bg-muted text-muted-foreground"
                          } ${isCurrent ? "ring-2 ring-zayka-600 ring-offset-2" : ""}`}
                      >
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-xs text-center ${isCompleted ? "text-zayka-600 font-medium" : "text-muted-foreground"
                          }`}
                      >
                        {step.label}
                      </span>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute h-0.5 w-full mt-4 ${index < currentStatusIndex ? "bg-zayka-600" : "bg-muted"
                            }`}
                          style={{
                            left: `${(100 / (statusSteps.length - 1)) * index}%`,
                            width: `${100 / (statusSteps.length - 1)}%`,
                            zIndex: -1,
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!showProgress && (
            <Badge variant="outline" className="w-fit">
              {order.status === "delivered" ? "Delivered" : order.status}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function getStatusIndex(status: string) {
  return statusSteps.findIndex((step) => step.key === status)
}
