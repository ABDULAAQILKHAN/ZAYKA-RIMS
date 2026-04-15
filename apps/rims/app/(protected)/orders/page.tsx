"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
  type OrderStatus,
  useCreateOrderMutation,
  useGetMenuQuery,
  useGetOrdersQuery,
  useGetTableSessionsQuery,
  useGetTablesQuery,
  useUpdateOrderStatusMutation,
} from "@/store/api"

type DraftItem = {
  menu_item_id: string
  quantity: string
}

const tableStatusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "delivered",
  "cancelled",
]

export default function OrdersPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: menu = [] } = useGetMenuQuery()
  const { data: tables = [] } = useGetTablesQuery()
  const { data: orders = [], isLoading } = useGetOrdersQuery()
  const { data: sessions = [] } = useGetTableSessionsQuery()

  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation()
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation()

  const [orderType, setOrderType] = useState<"table" | "takeaway">("table")
  const [selectedTableId, setSelectedTableId] = useState("")
  const [draftItems, setDraftItems] = useState<DraftItem[]>([{ menu_item_id: "", quantity: "1" }])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const availableMenu = useMemo(() => (menu?.length > 0 ? menu?.filter((item) => item?.is_available) : []), [menu])

  const subtotalPreview = useMemo(
    () =>
      draftItems.reduce((sum, row) => {
        const menuItem = availableMenu.find((entry) => entry?.id === row?.menu_item_id)
        if (!menuItem) {
          return sum
        }
        return sum + (menuItem?.price ?? 0) * Number(row?.quantity || 0)
      }, 0),
    [availableMenu, draftItems],
  )

  const gstPreview = Number((subtotalPreview * 0.05).toFixed(2))
  const totalPreview = Number((subtotalPreview + gstPreview).toFixed(2))

  if (!isMounted) {
    return null
  }

  // Show which table has an existing open session
  const getTableLabel = (tableId: string, tableNumber: string) => {
    const hasSession = sessions?.some((s) => s?.table_id === tableId)
    return hasSession ? `${tableNumber} (active session)` : tableNumber
  }

  const onCreateOrder = async () => {
    setFormError(null)

    const normalizedItems = draftItems
      .filter((row) => row?.menu_item_id)
      .map((row) => ({
        menu_item_id: row?.menu_item_id,
        quantity: Number(row?.quantity),
      }))

    if (normalizedItems.length === 0) {
      setFormError("Please add at least one menu item")
      return
    }

    if (orderType === "table" && !selectedTableId) {
      setFormError("Please select a table")
      return
    }

    try {
      await createOrder({
        order_type: orderType,
        table_id: orderType === "table" ? selectedTableId : undefined,
        items: normalizedItems,
      }).unwrap()

      setDraftItems([{ menu_item_id: "", quantity: "1" }])
      setSelectedTableId("")
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : "Failed to create order"

      setFormError(message)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Create dine-in orders for tables. Orders are grouped into table sessions.
        </p>
      </div>

      {/* Create Order */}
      <Card>
        <CardHeader>
          <CardTitle>Create Order</CardTitle>
          <CardDescription>
            Table orders are added to the table&apos;s active session. Use Takeaway for counter orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Order Type</p>
              <Select value={orderType} onValueChange={(value) => setOrderType(value as "table" | "takeaway")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table (Dine-in)</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === "table" ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Select Table</p>
                <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables?.length > 0 && tables?.map((table) => (
                      <SelectItem key={table?.id} value={table?.id}>
                        {getTableLabel(table?.id, table?.table_number)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {draftItems.map((row, index) => (
            <div key={`${row?.menu_item_id}-${index}`} className="grid gap-3 md:grid-cols-4">
              <Select
                value={row?.menu_item_id}
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
                  {availableMenu?.map((item) => (
                    <SelectItem key={item?.id} value={item?.id}>
                      {item?.name} (₹{item?.price ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                value={row?.quantity}
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
                  setDraftItems((prev) =>
                    prev.filter((_, rowIndex) => rowIndex !== index),
                  )
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
            <Button type="button" disabled={creatingOrder} onClick={onCreateOrder}>
              {creatingOrder ? "Creating..." : "Create Order"}
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

      {/* Active Table Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Table Sessions</CardTitle>
              <CardDescription>
                Each occupied table has a session grouping its orders. Bill from the Billing page.
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/billing">Go to Billing →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!sessions || sessions?.length === 0) ? (
            <p className="text-sm text-muted-foreground">No active table sessions.</p>
          ) : (
            <div className="space-y-4">
              {sessions?.length > 0 && sessions?.map((session) => (
                <div key={session?.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{session?.table_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Session {session?.id} · Started {session?.created_at ? new Date(session.created_at).toLocaleTimeString() : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{(session?.total ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {session?.orders?.length ?? 0} order{(session?.orders?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {session?.orders?.map((order) => (
                      <div key={order?.id} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">#{order?.id}</span>
                          <span className="ml-2 text-muted-foreground">
                            {order?.items?.map((i: any) => `${i?.menu_item_name ?? "Unknown"} x${i?.quantity ?? 0}`).join(", ") ?? ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>₹{(order?.total ?? 0).toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs">{order?.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.length > 0 && orders?.map((order) => (
                <TableRow key={order?.id}>
                  <TableCell className="font-medium">
                    {order?.id}
                    {order?.session_id ? (
                      <span className="block text-xs text-muted-foreground">
                        Session: {order?.session_id}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {order?.order_type === "table"
                      ? `Table ${order?.table_number ?? "-"}`
                      : order?.order_type === "takeaway"
                      ? "Takeaway"
                      : "Delivery"}
                  </TableCell>
                  <TableCell>
                    {order?.items
                      ?.map((item: any) => `${item?.menu_item_name ?? "Unknown"} x${item?.quantity ?? 0}`)
                      .join(", ") ?? ""}
                  </TableCell>
                  <TableCell>₹{(order?.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{order?.status}</Badge>
                      <Select
                        value={order?.status}
                        onValueChange={(value) =>
                          updateStatus({ id: order?.id, status: value as OrderStatus })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tableStatusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading || updatingStatus ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {isLoading ? "Loading orders..." : "Updating status..."}
                  </TableCell>
                </TableRow>
              ) : orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No active orders found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
