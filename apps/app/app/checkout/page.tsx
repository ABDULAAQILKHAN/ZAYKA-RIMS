import type { Metadata } from "next"
import CheckoutForm from "@/components/checkout/checkout-form"
import OrderSummary from "@/components/checkout/order-summary"

export const metadata: Metadata = {
  title: "Checkout - Zayka Restaurant",
  description: "Complete your order",
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <CheckoutForm />
        <OrderSummary />
      </div>
    </div>
  )
}
