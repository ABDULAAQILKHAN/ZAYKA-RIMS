"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import CartItems from "@/components/cart/cart-items"
import CartSummary from "@/components/cart/cart-summary"
import { useAppSelector } from "@/store/hooks"

export default function CartPage() {
  const router = useRouter()
  const token = useAppSelector((state) => state.auth.token)

  useEffect(() => {
    if (!token) {
      router.push("/auth/login?redirect=/cart")
    }
  }, [token, router])

  if (!token) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <CartItems />
        <CartSummary />
      </div>
    </div>
  )
}
