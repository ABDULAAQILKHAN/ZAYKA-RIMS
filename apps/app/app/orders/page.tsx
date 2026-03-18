import type { Metadata } from "next"
import OrderTracking from "@/components/orders/order-tracking"

export const metadata: Metadata = {
  title: "Track Orders - Zayka Restaurant",
  description: "Track your current and past orders",
}

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <OrderTracking />
    </div>
  )
}
