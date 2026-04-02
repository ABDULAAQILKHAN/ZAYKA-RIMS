"use client"

import { useState } from "react"
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@zayka/ui"
import { formatCurrency } from "@zayka/utils"
import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useGetMenuItemsQuery,
} from "@/store/api"
import { Plus, Trash2 } from "lucide-react"
import type { RimsOrder } from "@zayka/types"

interface CartLine {
  menuItemId: string
  quantity: number
  price: number
}

const STATUS_OPTIONS: RimsOrder["status"][] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]

export default function OrdersPage() {
  const { data: rawOrders, isLoading } = useGetOrdersQuery()
  const { data: rawMenuItems } = useGetMenuItemsQuery()

  const orders = Array.isArray(rawOrders) ? rawOrders : []
  const menuItems = Array.isArray(rawMenuItems) ? rawMenuItems : []
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation()
  const [updateOrderStatus] = useUpdateOrderStatusMutation()

  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState("")

  const addToCart = () => {
    const item = menuItems.find((m) => m.id === selectedMenuId)
    if (!item) return
    const existing = cart.find((c) => c.menuItemId === item.id)
    if (existing) {
      setCart(cart.map((c) => (c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)))
    } else {
      setCart([...cart, { menuItemId: item.id, quantity: 1, price: item.price }])
    }
    setSelectedMenuId("")
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((c) => c.menuItemId !== menuItemId))
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) return
    await createOrder({ items: cart })
    setCart([])
    setOpen(false)
  }

  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status))
  const completedOrders = orders.filter((o) => o.status === "completed")
  const cancelledOrders = orders.filter((o) => o.status === "cancelled")

  const renderOrderTable = (list: RimsOrder[]) =>
    list.length === 0 ? (
      <p className="text-sm text-muted-foreground py-4">No orders to display.</p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-40">Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
              <TableCell>{order.items.map((i) => `${i.menuItemName} x${i.quantity}`).join(", ")}</TableCell>
              <TableCell>{formatCurrency(order.total)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    order.status === "completed"
                      ? "secondary"
                      : order.status === "cancelled"
                        ? "destructive"
                        : "default"
                  }
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                {!["completed", "cancelled"].includes(order.status) && (
                  <Select
                    value={order.status}
                    onValueChange={(val) =>
                      updateOrderStatus({ id: order.id, status: val as RimsOrder["status"] })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Create and manage orders.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Order</DialogTitle>
            </DialogHeader>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Menu Item</Label>
                <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {formatCurrency(m.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addToCart} disabled={!selectedMenuId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {cart.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((line) => {
                    const mi = menuItems.find((m) => m.id === line.menuItemId)
                    return (
                      <TableRow key={line.menuItemId}>
                        <TableCell>{mi?.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 w-16"
                            value={line.quantity}
                            onChange={(e) =>
                              setCart(
                                cart.map((c) =>
                                  c.menuItemId === line.menuItemId
                                    ? { ...c, quantity: Math.max(1, Number(e.target.value)) }
                                    : c
                                )
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(line.price * line.quantity)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(line.menuItemId)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            <div className="text-right font-semibold">
              Total: {formatCurrency(cart.reduce((sum, c) => sum + c.price * c.quantity, 0))}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateOrder} disabled={creating || cart.length === 0}>
                Place Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <Card>
              <CardContent className="pt-6">{renderOrderTable(activeOrders)}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed">
            <Card>
              <CardContent className="pt-6">{renderOrderTable(completedOrders)}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cancelled">
            <Card>
              <CardContent className="pt-6">{renderOrderTable(cancelledOrders)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
