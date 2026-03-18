"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAppSelector } from "@/store/hooks"
import { useAddToCartMutation, CartItem } from "@/store/cartApi"
import { toast } from "sonner"

export interface AddToCartItem {
  id: string
  name: string
  image: string
  fullPrice: number
  halfPrice?: number
  isVeg?: boolean
}

interface AddToCartDialogProps {
  item: AddToCartItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddToCartDialog({ item, open, onOpenChange }: AddToCartDialogProps) {
  const router = useRouter()
  const token = useAppSelector((state) => state.auth.token)
  const [addToCart, { isLoading }] = useAddToCartMutation()
  const [size, setSize] = useState<"Full" | "Half">("Full")
  const [quantity, setQuantity] = useState(1)

  if (!item) return null

  const hasHalfOption = !!item.halfPrice
  const currentPrice = size === "Full" ? item.fullPrice : (item.halfPrice || item.fullPrice)
  const totalPrice = currentPrice * quantity

  const handleAdd = async () => {
    // Check if user is logged in
    if (!token) {
      toast.error("Please login to add items to cart")
      onOpenChange(false)
      router.push("/auth/login?redirect=/menu")
      return
    }

    try {
      await addToCart({
        menuItemId: item.id,
        quantity: quantity,
        size: size
      }).unwrap()
      toast.success(`Added ${quantity}x ${size} ${item.name} to cart`)
      // Reset state and close
      setSize("Full")
      setQuantity(1)
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to add item to cart")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset when closing
      setSize("Full")
      setQuantity(1)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Cart</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              {item.isVeg !== undefined && (
                <Badge variant={item.isVeg ? "green" : "destructive"} className="ml-2">
                  {item.isVeg ? "Veg" : "Non-Veg"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              ₹{currentPrice} per {size.toLowerCase()} portion
            </p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Portion</label>
          <div className="flex gap-2">
            <Button
              variant={size === "Full" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSize("Full")}
            >
              <div className="flex flex-col items-center">
                <span>Full</span>
                <span className="text-xs opacity-80">₹{item.fullPrice}</span>
              </div>
            </Button>
            {hasHalfOption && (
              <Button
                variant={size === "Half" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSize("Half")}
              >
                <div className="flex flex-col items-center">
                  <span>Half</span>
                  <span className="text-xs opacity-80">₹{item.halfPrice}</span>
                </div>
              </Button>
            )}
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quantity</label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <div className="flex-1 text-left">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-zayka-600 dark:text-zayka-400">₹{totalPrice}</p>
          </div>
          <Button onClick={handleAdd} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Adding..." : "Add to Cart"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
