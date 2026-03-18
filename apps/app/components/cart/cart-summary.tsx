"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAppSelector } from "@/store/hooks"
import { useGetCartQuery, CartItem } from "@/store/cartApi"

export default function CartSummary() {
  const token = useAppSelector((state) => state.auth.token)
  const { data: cartData } = useGetCartQuery(undefined, { skip: !token })
  const items: CartItem[] = Array.isArray(cartData) ? cartData : []

  const subtotal = items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0)
  const deliveryFee = subtotal > 30 ? 0 : 3.99
  const tax = subtotal * 0.08
  const total = subtotal + deliveryFee + tax

  if (items.length === 0) {
    return null
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium text-lg">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        {deliveryFee > 0 && (
          <p className="text-xs text-muted-foreground">Add ₹{(30 - subtotal).toFixed(2)} more for free delivery</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
