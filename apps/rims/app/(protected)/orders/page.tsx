"use client"

import { useMemo, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zayka/ui"
import {
  useCreateOrderMutation,
  useGetMenuItemsQuery,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
} from "@/store/api"
import type { OrderStatus } from "@zayka/types"

interface OrderItemDraft {
  menu_item_id: string
  quantity: string
}

const statusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]

export default function OrdersPage() {
  const { data: menuItems } = useGetMenuItemsQuery()
  const { data: orders, isLoading } = useGetOrdersQuery()
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation()
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation()

  const [draftItems, setDraftItems] = useState<OrderItemDraft[]>([
    { menu_item_id: "", quantity: "1" },
  ])
  const [error, setError] = useState<string | null>(null)

  const orderTotalPreview = useMemo(
    () =>
      draftItems.reduce((sum, row) => {
        const menuItem = (menuItems ?? []).find((item) => item.id === row.menu_item_id)
        if (!menuItem) {
          return sum
        }
        return sum + menuItem.price * Number(row.quantity)
      }, 0),
    [draftItems, menuItems],
  )

  const onCreateOrder = async () => {
    setError(null)

    const normalized = draftItems
      .filter((row) => row.menu_item_id.trim().length > 0)
      .map((row) => ({
        menu_item_id: row.menu_item_id,
        quantity: Number(row.quantity),
      }))

    try {
      await createOrder({ items: normalized }).unwrap()
      setDraftItems([{ menu_item_id: "", quantity: "1" }])
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to create order"
      setError(message)
    }
  }

  const groupedOrders = {
    active: (orders ?? []).filter((order) =>
      ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(order.status),
    ),
    delivered: (orders ?? []).filter((order) => order.status === "delivered"),
    cancelled: (orders ?? []).filter((order) => order.status === "cancelled"),
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Create orders, add items, and manage lifecycle statuses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {draftItems.map((row, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-4">
              <Select
                value={row.menu_item_id}
                onValueChange={(value) =>
                  setDraftItems((prev) =>
                    prev.map((item, rowIndex) =>
                      rowIndex === index ? { ...item, menu_item_id: value } : item,
                    ),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {(menuItems ?? [])
                    .filter((item) => item.is_available)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (INR {item.price})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                value={row.quantity}
                onChange={(event) =>
                  setDraftItems((prev) =>
                    prev.map((item, rowIndex) =>
                      rowIndex === index ? { ...item, quantity: event.target.value } : item,
                    ),
                  )
                }
              />

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDraftItems((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraftItems((prev) => [...prev, { menu_item_id: "", quantity: "1" }])
              }
            >
              Add Item
            </Button>
            <Button type="button" onClick={onCreateOrder} disabled={creatingOrder}>
              {creatingOrder ? "Creating..." : "Create Order"}
            </Button>
            <p className="text-sm text-muted-foreground">Subtotal preview: INR {orderTotalPreview}</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {(["active", "delivered", "cancelled"] as const).map((bucket) => (
          <TabsContent key={bucket} value={bucket}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{bucket} Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedOrders[bucket].map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {order.items.map((item) => `${item.menu_item_name} x${item.quantity}`).join(", ")}
                        </TableCell>
                        <TableCell>INR {order.total}</TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateStatus({
                                order_id: order.id,
                                status: value as OrderStatus,
                              })
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {isLoading || updatingStatus ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Loading orders...
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
