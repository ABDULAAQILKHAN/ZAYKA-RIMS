"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppSelector } from "@/store/hooks"
import { 
  useGetCartQuery, 
  useUpdateCartItemMutation, 
  useRemoveFromCartMutation,
  CartItem 
} from "@/store/cartApi"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function CartItems() {
  const token = useAppSelector((state) => state.auth.token)
  const { data: cartData, isLoading } = useGetCartQuery(undefined, { skip: !token })
  const items: CartItem[] = Array.isArray(cartData) ? cartData : []
  
  const [updateCartItem] = useUpdateCartItemMutation()
  const [removeFromCart] = useRemoveFromCartMutation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button asChild>
          <a href="/menu">Browse Menu</a>
        </Button>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {items.map((cartItem) => (
        <motion.div key={cartItem.cartItemId} variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image
                    src={cartItem.image || "/placeholder.svg"}
                    alt={cartItem.name || "Cart item"}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{cartItem.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">₹{(cartItem.price || 0)} each</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItem({ id: cartItem.cartItemId, quantity: Math.max(0, cartItem.quantity - 1) })}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{cartItem.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItem({ id: cartItem.cartItemId, quantity: cartItem.quantity + 1 })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{((cartItem.price || 0) * cartItem.quantity).toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(cartItem.cartItemId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
