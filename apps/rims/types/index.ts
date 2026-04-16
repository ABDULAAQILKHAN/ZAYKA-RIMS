import type { MenuItem, OrderStatus, UserRole } from "@zayka/types"

export type { MenuItem, OrderStatus, UserRole } from "@zayka/types"

export type RimsRole = UserRole | "desk-manager"

export interface Ingredient {
  id: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  createdAt?: string
  updatedAt?: string
}

export interface IngredientInput {
  name: string
  unit: string
  currentStock: number
  minStock: number
}

export interface RecipeIngredient {
  ingredientId: string
  quantityRequired: number
}

export interface MenuItemRecord
  extends Omit<MenuItem, "isAvailable" | "image" | "isVeg" | "category"> {
  isAvailable: boolean
}

export interface MenuItemWithRecipe extends MenuItemRecord {
  recipe: Array<
    RecipeIngredient & {
      ingredientName?: string
      ingredientUnit?: string
      currentStock?: number
    }
  >
}

export interface OrderItemInput {
  menuItemId: string
  quantity: number
}

export interface OrderRecord {
  id: string
  status: OrderStatus
  subtotal: number
  gst: number
  total: number
  createdAt: string
  items: Array<{
    id: string
    menuItemId: string
    quantity: number
    unitPrice: number
    lineTotal: number
    menuItemName: string
  }>
}

export interface Invoice {
  id: string
  orderId: string
  subtotal: number
  gst: number
  total: number
  status: "generated" | "paid"
  createdAt: string
}
