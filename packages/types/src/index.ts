// ─── Menu ───────────────────────────────────────────────
export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVeg: boolean
  isSpicy?: boolean
  isAvailable?: boolean
}

export interface Category {
  id: string
  name: string
  count: number
}

// ─── Orders ─────────────────────────────────────────────
export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"

// ─── User / Auth ────────────────────────────────────────
export type UserRole = "customer" | "admin" | "staff" | "manager" | "rider" | "desk-manager"

export interface UserProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  avatar: string
  role: UserRole
  isDark: boolean
  createdAt: string
  updatedAt: string
}

// ─── Cart ───────────────────────────────────────────────
export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
}

// ─── Address ────────────────────────────────────────────
export interface Address {
  id: string
  userId: string
  label: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

// ─── Inventory (RIMS) ──────────────────────────────────
export interface Ingredient {
  id: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  costPerUnit: number
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minThreshold: number
  costPerUnit: number
  supplier?: string
  lastRestocked?: string
  expiryDate?: string
}

// ─── Recipe (Menu ↔ Ingredient Mapping) ────────────────
export interface Recipe {
  id: string
  menuItemId: string
  ingredientId: string
  quantityRequired: number
  ingredient?: Ingredient
  menuItem?: MenuItem
}

// ─── RIMS Order ────────────────────────────────────────
export interface RimsOrder {
  id: string
  items: RimsOrderItem[]
  subtotal: number
  gst: number
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

export interface RimsOrderItem {
  menuItemId: string
  menuItemName: string
  quantity: number
  price: number
}

// ─── Invoice / Billing ─────────────────────────────────
export interface Invoice {
  id: string
  orderId: string
  subtotal: number
  gstPercent: number
  gstAmount: number
  total: number
  status: "pending" | "paid" | "overdue"
  createdAt: string
  paidAt?: string
}

export interface Supplier {
  id: string
  name: string
  contactEmail: string
  contactPhone: string
  address: string
  items: string[]
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  items: PurchaseOrderItem[]
  status: "draft" | "submitted" | "received" | "cancelled"
  totalAmount: number
  createdAt: string
  expectedDelivery?: string
}

export interface PurchaseOrderItem {
  inventoryItemId: string
  name: string
  quantity: number
  unitCost: number
}
