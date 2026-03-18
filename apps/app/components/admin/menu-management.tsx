"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Clock, SquareDot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MenuItemForm } from "./menu-item-form"
import {
  useGetMenuItemsQuery,
  useGetActiveMenuCategoriesQuery,
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailabilityMutation,
  type MenuItem
} from "@/store/menuApi"
import { deleteImage, getImagePathFromUrl } from "@/lib/supabase/storage"
import toast from "react-hot-toast"

export default function MenuManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const { data: menuItems = [], isLoading, refetch } = useGetMenuItemsQuery({
    category: selectedCategory || undefined
  })
  const { data: categories = [] } = useGetActiveMenuCategoriesQuery()
  const [deleteMenuItem] = useDeleteMenuItemMutation()
  const [toggleAvailability] = useToggleMenuItemAvailabilityMutation()

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDeleteItem = async (item: MenuItem) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      try {
        // Delete the image first
        if (item.image) {
          const imagePath = getImagePathFromUrl(item.image)
          if (imagePath) {
            await deleteImage(imagePath)
          }
        }

        await deleteMenuItem(item.id).unwrap()
        toast.success("Menu item deleted successfully!")
      } catch (error) {
        toast.error("Failed to delete menu item")
        console.error("Delete error:", error)
      }
    }
  }

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await toggleAvailability({
        id: item.id,
        isAvailable: !item.isAvailable
      }).unwrap()
      toast.success(`Menu item ${!item.isAvailable ? 'enabled' : 'disabled'} successfully!`)
    } catch (error) {
      toast.error("Failed to update availability")
      console.error("Toggle availability error:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-2">Add, edit, and manage your restaurant menu</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"0"}>All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
                <div className="relative h-48">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  <div className="absolute top-2 left-2">
                    {!item.isAvailable && (
                      <Badge variant="destructive">Unavailable</Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Badge variant={item.isVeg ? "green" : "destructive"}>
                      {item.isVeg ? "Veg" : "Non-Veg"}
                      <SquareDot className="h-3 w-3" />
                    </Badge>
                    {item.isSpicy && <Badge variant="destructive">Spicy</Badge>}
                    {item.preparationTime && item.preparationTime as number > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.preparationTime}m
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-zayka-600">₹{item.fullPrice}</span>
                      {item.halfPrice && <span className="text-xs text-muted-foreground">Half: ₹{item.halfPrice}</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

                  {/* Ingredients */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Ingredients:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.slice(0, 3).map((ingredient, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {ingredient}
                          </span>
                        ))}
                        {item.ingredients.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.ingredients.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Allergens */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-orange-600 mb-1">Allergens:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map((allergen, index) => (
                          <span key={index} className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {categories.find(c => c.id === item.categoryId)?.name || item.categoryId}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(item)}
                        className={item.isAvailable ? "text-orange-600" : "text-green-600"}
                      >
                        {item.isAvailable ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItemId(item.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No menu items found.</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      {(isAddDialogOpen || editingItemId) && (
        <MenuItemForm
          itemId={editingItemId}
          onClose={() => {
            setIsAddDialogOpen(false)
            setEditingItemId(null)
          }}
        />
      )}
    </div>
  )
}


