"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useGetAvailableMenuItemsQuery, MenuItem } from "@/store/menuApi"
import { AddToCartDialog, AddToCartItem } from "@/components/menu/add-to-cart-dialog"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function MenuItemCard({ menuItem, onAddToCart }: { menuItem: MenuItem; onAddToCart: (item: AddToCartItem) => void }) {
  const priceDisplay = menuItem.halfPrice 
    ? `₹${menuItem.halfPrice} - ₹${menuItem.fullPrice}`
    : `₹${menuItem.fullPrice}`

  return (
    <motion.div variants={itemVariants} layout>
      <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md flex flex-col">
        <div className="relative h-48 flex-shrink-0">
          <Image src={menuItem.image || "/placeholder.svg"} alt={menuItem.name} fill className="object-cover" />
          <Badge className="absolute top-2 right-2" variant={menuItem.isVeg ? "green" : "destructive"}>
            {menuItem.isVeg ? "Veg" : "Non-Veg"}
          </Badge>
          {menuItem.isSpicy && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              Spicy
            </Badge>
          )}
        </div>
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold">{menuItem.name}</h3>
            <span className="font-medium text-zayka-600 dark:text-zayka-400">{priceDisplay}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{menuItem.description}</p>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{menuItem.category}</Badge>
              <Button
                size="sm"
                onClick={() => onAddToCart({
                  id: menuItem.id,
                  name: menuItem.name,
                  image: menuItem.image,
                  fullPrice: menuItem.fullPrice,
                  halfPrice: menuItem.halfPrice,
                  isVeg: menuItem.isVeg
                })}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function MenuList() {
  const searchParams = useSearchParams()
  const category = searchParams.get("category") || ""
  const [selectedItem, setSelectedItem] = useState<AddToCartItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: allMenuItems = [], isLoading } = useGetAvailableMenuItemsQuery({
    category: category || undefined
  })

  // Filter client-side if the API doesn't handle the filter exactly as expected, 
  // or just to be safe. But the query passes it.
  const menuItems = category ? allMenuItems.filter(menuItem => menuItem.categoryId === category) : allMenuItems

  const handleAddToCart = (item: AddToCartItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {menuItems.map((menuItem) => (
          <MenuItemCard key={menuItem.id} menuItem={menuItem} onAddToCart={handleAddToCart} />
        ))}
      </motion.div>

      <AddToCartDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items found in this category.</p>
        </div>
      )}
    </div>
  )
}
