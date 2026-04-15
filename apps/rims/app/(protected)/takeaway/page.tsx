"use client"

import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
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
} from "@zayka/ui"
import {
  useCreateTakeawayOrderMutation,
  useGetMenuQuery,
  useGetOrderHistoryQuery,
  type InvoiceRecord,
} from "@/store/api"

type DraftItem = {
  menu_item_id: string
  quantity: string
}

export default function TakeawayPage() {
  const { data: menu = [] } = useGetMenuQuery()
  const { data: history = [] } = useGetOrderHistoryQuery({ order_type: "takeaway" })

  const [createTakeaway, { isLoading: creating }] = useCreateTakeawayOrderMutation()

  const [draftItems, setDraftItems] = useState<DraftItem[]>([{ menu_item_id: "", quantity: "1" }])
  const [formError, setFormError] = useState<string | null>(null)
  const [lastInvoice, setLastInvoice] = useState<InvoiceRecord | null>(null)

  const availableMenu = menu.filter((item) => item.is_available)

  const subtotalPreview = useMemo(
    () =>
      draftItems.reduce((sum, row) => {
        const menuItem = availableMenu.find((entry) => entry.id === row.menu_item_id)
        if (!menuItem) return sum
        return sum + menuItem.price * Number(row.quantity || 0)
      }, 0),
    [availableMenu, draftItems],
  )

  const gstPreview = Number((subtotalPreview * 0.05).toFixed(2))
  const totalPreview = Number((subtotalPreview + gstPreview).toFixed(2))

  const onPlaceAndBill = async () => {
    setFormError(null)
    setLastInvoice(null)

    const normalizedItems = draftItems
      .filter((row) => row.menu_item_id)
      .map((row) => ({
        menu_item_id: row.menu_item_id,
        quantity: Number(row.quantity),
      }))

    if (normalizedItems.length === 0) {
      setFormError("Please add at least one menu item")
      return
    }

    try {
      const result = await createTakeaway({ items: normalizedItems }).unwrap()
      setLastInvoice(result.invoice)
      setDraftItems([{ menu_item_id: "", quantity: "1" }])
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : "Failed to create takeaway order"

      setFormError(message)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Takeaway</h1>
        <p className="mt-1 text-muted-foreground">
          Quick counter orders — place the order and generate the bill instantly.
        </p>
      </div>

      {/* Create Takeaway Order */}
      <Card>
        <CardHeader>
          <CardTitle>New Takeaway Order</CardTitle>
          <CardDescription>
            Select items, review the total, and place the order. Invoice is generated immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {draftItems.map((row, index) => (
            <div key={`${row.menu_item_id}-${index}`} className="grid gap-3 md:grid-cols-4">
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
                  {availableMenu.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (₹{item.price})
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
                variant="outline"
                type="button"
                onClick={() =>
                  setDraftItems((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraftItems((prev) => [...prev, { menu_item_id: "", quantity: "1" }])
              }
            >
              Add Item
            </Button>
            <Button type="button" disabled={creating} onClick={onPlaceAndBill}>
              {creating ? "Processing..." : "Place & Bill"}
            </Button>
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p>Subtotal: ₹{subtotalPreview}</p>
            <p>GST (5%): ₹{gstPreview}</p>
            <p className="font-semibold">Total: ₹{totalPreview}</p>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </CardContent>
      </Card>

      {/* Last Invoice */}
      {lastInvoice ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Generated</CardTitle>
            <Button variant="outline" onClick={() => window.print()}>
              Print Invoice
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <p>Invoice ID: {lastInvoice.id}</p>
              {lastInvoice.order_id ? <p>Order ID: {lastInvoice.order_id}</p> : null}
              <p>Type: Takeaway</p>
              <p>Date: {new Date(lastInvoice.created_at).toLocaleString()}</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastInvoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.menu_item_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unit_price}</TableCell>
                    <TableCell>₹{item.line_total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="ml-auto max-w-xs space-y-1 rounded-md border p-3 text-sm">
              <p>Subtotal: ₹{lastInvoice.subtotal}</p>
              <p>GST (5%): ₹{lastInvoice.gst}</p>
              <p className="font-semibold">Total: ₹{lastInvoice.total}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Recent Takeaway Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Takeaway Orders</CardTitle>
          <CardDescription>Past takeaway orders from history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No takeaway orders yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {history.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    {order.items
                      .map((item) => `${item.menu_item_name} x${item.quantity}`)
                      .join(", ")}
                  </TableCell>
                  <TableCell>₹{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
