"use client"

import { useState } from "react"
import {
    useGetReadyOrdersQuery,
    useGetMyDeliveriesQuery,
    usePickupOrderMutation,
    useDeliverOrderMutation,
    type Order
} from "@/store/ordersApi"
import { formatCurrency, formatOrderDate } from "@zayka/utils"
import { Button } from "@zayka/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@zayka/ui"
import { Badge } from "@zayka/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zayka/ui"
import {
    Package,
    Truck,
    CheckCircle,
    MapPin,
    Phone,
    User,
    Clock,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Navigation
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@zayka/utils"

export default function RiderDeliveryManagement() {
    const {
        data: readyOrders = [],
        isLoading: isLoadingReady,
        isFetching: isFetchingReady,
        refetch: refetchReady
    } = useGetReadyOrdersQuery(undefined, {
        pollingInterval: 30000, // Poll every 30 seconds
        refetchOnFocus: true,
    })

    const {
        data: myDeliveries = [],
        isLoading: isLoadingDeliveries,
        isFetching: isFetchingDeliveries,
        refetch: refetchDeliveries
    } = useGetMyDeliveriesQuery(undefined, {
        pollingInterval: 30000,
        refetchOnFocus: true,
    })

    const [pickupOrder, { isLoading: isPickingUp }] = usePickupOrderMutation()
    const [deliverOrder, { isLoading: isDelivering }] = useDeliverOrderMutation()
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("ready")

    const handlePickup = async (orderId: string) => {
        try {
            await pickupOrder(orderId).unwrap()
            toast.success("Order picked up! Ready for delivery.")
            setActiveTab("delivering")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to pickup order")
        }
    }

    const handleDeliver = async (orderId: string) => {
        try {
            await deliverOrder(orderId).unwrap()
            toast.success("Order delivered successfully!")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to mark as delivered")
        }
    }

    const handleRefresh = () => {
        refetchReady()
        refetchDeliveries()
    }

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
    }

    const isLoading = isLoadingReady || isLoadingDeliveries
    const isFetching = isFetchingReady || isFetchingDeliveries

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Header - Fixed at top */}
            <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 safe-area-top">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Deliveries</h1>
                        <p className="text-sm text-muted-foreground">
                            {readyOrders.length} ready • {myDeliveries.length} in transit
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isFetching}
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 pb-20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="ready" className="gap-2">
                            <Package className="h-4 w-4" />
                            Ready ({readyOrders.length})
                        </TabsTrigger>
                        <TabsTrigger value="delivering" className="gap-2">
                            <Truck className="h-4 w-4" />
                            Delivering ({myDeliveries.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Ready Orders Tab */}
                    <TabsContent value="ready" className="space-y-3 mt-0">
                        {readyOrders.length === 0 ? (
                            <EmptyState
                                icon={Package}
                                title="No orders ready"
                                description="Check back soon for new orders to deliver"
                            />
                        ) : (
                            readyOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    type="ready"
                                    isExpanded={expandedOrderId === order.id}
                                    onToggleExpand={() => toggleExpand(order.id)}
                                    onAction={() => handlePickup(order.id)}
                                    isActionLoading={isPickingUp}
                                />
                            ))
                        )}
                    </TabsContent>

                    {/* Delivering Tab */}
                    <TabsContent value="delivering" className="space-y-3 mt-0">
                        {myDeliveries.length === 0 ? (
                            <EmptyState
                                icon={Truck}
                                title="No active deliveries"
                                description="Pick up a ready order to start delivering"
                            />
                        ) : (
                            myDeliveries.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    type="delivering"
                                    isExpanded={expandedOrderId === order.id}
                                    onToggleExpand={() => toggleExpand(order.id)}
                                    onAction={() => handleDeliver(order.id)}
                                    isActionLoading={isDelivering}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

// Empty State Component
function EmptyState({
    icon: Icon,
    title,
    description
}: {
    icon: any
    title: string
    description: string
}) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}

// Order Card Component
function OrderCard({
    order,
    type,
    isExpanded,
    onToggleExpand,
    onAction,
    isActionLoading
}: {
    order: Order
    type: "ready" | "delivering"
    isExpanded: boolean
    onToggleExpand: () => void
    onAction: () => void
    isActionLoading: boolean
}) {
    const formattedDate = formatOrderDate(order.createdAt)

    const openMaps = () => {
        // Encode the address for Google Maps
        const encodedAddress = encodeURIComponent(order.deliveryAddress)
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
    }

    return (
        <Card className="overflow-hidden">
            {/* Card Header - Always Visible */}
            <div
                className="p-4 cursor-pointer active:bg-muted/50 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge
                                variant={type === "ready" ? "default" : "secondary"}
                                className="shrink-0"
                            >
                                {type === "ready" ? "Ready for Pickup" : "Out for Delivery"}
                            </Badge>
                        </div>
                        <p className="font-semibold truncate">
                            {order.customerName || "Customer"}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formattedDate.time} • {formattedDate.date}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-lg">
                            {formatCurrency(order.total)}
                        </span>
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t">
                    {/* Order Items */}
                    <div className="p-4 bg-muted/30">
                        <h4 className="font-medium text-sm mb-2">Order Items</h4>
                        <ul className="space-y-1">
                            {order.items.map((item, index) => (
                                <li key={index} className="flex justify-between text-sm">
                                    <span>
                                        {item.quantity}x {item.name}
                                        {item.size && <span className="text-muted-foreground"> ({item.size})</span>}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Info */}
                    <div className="p-4 space-y-3">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Delivery Address</p>
                                <p className="text-sm text-muted-foreground">
                                    {order.deliveryAddress}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    openMaps()
                                }}
                            >
                                <Navigation className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Phone */}
                        {order.customerPhone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Phone</p>
                                    <a
                                        href={`tel:${order.customerPhone}`}
                                        className="text-sm text-primary underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {order.customerPhone}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Delivery Instructions */}
                        {order.deliveryInstructions && (
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Instructions</p>
                                    <p className="text-sm text-muted-foreground">
                                        {order.deliveryInstructions}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="p-4 pt-0">
                        <Button
                            className="w-full h-12 text-base"
                            onClick={(e) => {
                                e.stopPropagation()
                                onAction()
                            }}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : type === "ready" ? (
                                <Truck className="h-5 w-5 mr-2" />
                            ) : (
                                <CheckCircle className="h-5 w-5 mr-2" />
                            )}
                            {type === "ready" ? "Pick Up Order" : "Mark as Delivered"}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    )
}
