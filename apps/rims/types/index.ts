// Re-export shared types and add RIMS-specific types
export type { InventoryItem, Supplier, MenuItem, Order, OrderItem } from "@zayka/types"

// RIMS-specific types
export interface Invoice {
  id: string
  orderId: string
  amount: number
  status: "pending" | "paid" | "overdue"
  createdAt: string
  dueDate: string
}
