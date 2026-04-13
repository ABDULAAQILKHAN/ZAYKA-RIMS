import type { MenuItem, OrderStatus, UserRole } from "@zayka/types"

export type { MenuItem, OrderStatus, UserRole } from "@zayka/types"

export type RimsRole = UserRole | "desk-manager"

export interface Ingredient {
  id: string
  name: string
  unit: string
  current_stock: number
  min_stock: number
  created_at?: string
  updated_at?: string
}

export interface IngredientInput {
  name: string
  unit: string
  current_stock: number
  min_stock: number
}

export interface RecipeIngredient {
  ingredient_id: string
  quantity_required: number
}

export interface MenuItemRecord
  extends Omit<MenuItem, "isAvailable" | "image" | "isVeg" | "category"> {
  is_available: boolean
}

export interface MenuItemWithRecipe extends MenuItemRecord {
  recipe: Array<
    RecipeIngredient & {
      ingredient_name?: string
      ingredient_unit?: string
      current_stock?: number
    }
  >
}

export interface OrderItemInput {
  menu_item_id: string
  quantity: number
}

export interface OrderRecord {
  id: string
  status: OrderStatus
  subtotal: number
  gst: number
  total: number
  created_at: string
  items: Array<{
    id: string
    menu_item_id: string
    quantity: number
    unit_price: number
    line_total: number
    menu_item_name: string
  }>
}

export interface Invoice {
  id: string
  order_id: string
  subtotal: number
  gst: number
  total: number
  status: "generated" | "paid"
  created_at: string
}
