"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
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
  menuItemId: string
  name: string
  price: number
  quantity: number
  size: "Full" | "Half"
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

function SearchSelect({
  value,
  onValueChange,
  items,
  placeholder = "Select item",
  searchPlaceholder = "Search...",
}: {
  value: string;
  onValueChange: (v: string) => void;
  items: { id: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((m) => m.label.toLowerCase().includes(lower));
  }, [search, items]);

  const selectedItem = items.find((m) => m.id === value);

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <span className="opacity-50 text-xs">▼</span>
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md flex flex-col bg-background">
            <div className="p-2 border-b">
              <Input
                autoFocus
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1 rounded-b-md">
              {filtered.length === 0 ? (
                <p className="p-2 text-sm text-center text-muted-foreground w-full">
                  No items found.
                </p>
              ) : null}
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="cursor-pointer flex w-full select-none items-center rounded-sm py-1.5 px-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onValueChange(item.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: menu = [] } = useGetMenuQuery()
  const { data: tables = [] } = useGetTablesQuery({ status: "available" })
  const { data: orders = [], isLoading } = useGetOrdersQuery()
  const { data: sessions = [] } = useGetTableSessionsQuery()

  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation()
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation()

  const [orderType, setOrderType] = useState<"table" | "takeaway">("table")
  const [selectedTableId, setSelectedTableId] = useState("")
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const availableMenu = useMemo(() => (menu?.length > 0 ? menu?.filter((item) => item?.isAvailable) : []), [menu])
  console.log('menu: ', menu)
  console.log('available menus: ', availableMenu)
  const calculateItemPrice = (item: DraftItem) => {
    const unitPrice = item.size === "Half" ? Math.round(item.price * 0.6) : item.price;
    return unitPrice * item.quantity;
  }

  const subtotalPreview = useMemo(
    () => draftItems.reduce((sum, item) => sum + calculateItemPrice(item), 0),
    [draftItems],
  )

  const handleAddItem = (menuItemId: string) => {
    const menuItem = availableMenu.find(m => m.id === menuItemId)
    if (!menuItem) return

    setDraftItems(prev => {
      const existingIdx = prev.findIndex(item => item.menuItemId === menuItemId && item.size === "Full")
      if (existingIdx >= 0) {
        const newDrafts = [...prev]
        newDrafts[existingIdx].quantity += 1
        return newDrafts
      }
      return [...prev, {
        menuItemId: menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        size: "Full"
      }]
    })
  }

  const updateDraftQuantity = (index: number, delta: number) => {
    setDraftItems(prev => {
      const newDrafts = [...prev]
      const newQuantity = newDrafts[index].quantity + delta
      if (newQuantity < 1) return prev
      newDrafts[index].quantity = newQuantity
      return newDrafts
    })
  }

  const updateDraftSize = (index: number, size: "Full" | "Half") => {
    setDraftItems(prev => {
      const newDrafts = [...prev]
      newDrafts[index].size = size
      return newDrafts
    })
  }

  const removeDraftItem = (index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index))
  }

  const gstPreview = Number((subtotalPreview * 0.05).toFixed(2))
  const totalPreview = Number((subtotalPreview + gstPreview).toFixed(2))

  if (!isMounted) {
    return null
  }

  // Show which table has an existing open session
  const getTableLabel = (tableId: string, tableNumber: number) => {
    const hasSession = sessions?.some((s) => s?.tableId === tableId && s.status === "open")
    return hasSession ? `${tableNumber} (active session)` : String(tableNumber)
  }

  const onCreateOrder = async () => {
    setFormError(null)

    const normalizedItems = draftItems.map((row) => ({
      menuItemId: row.menuItemId,
      quantity: row.quantity,
      size: row.size,
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
        orderType: orderType,
        tableId: orderType === "table" ? selectedTableId : undefined,
        items: normalizedItems,
      }).unwrap()

      setDraftItems([])
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
                <SearchSelect
                  value={selectedTableId}
                  onValueChange={setSelectedTableId}
                  items={(tables || []).map((table) => ({
                    id: table?.id,
                    label: getTableLabel(table?.id, table?.tableNumber)
                  }))}
                  placeholder="Choose table"
                  searchPlaceholder="Search table..."
                />
              </div>
            ) : null}
          </div>

          {/* New Search Bar */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Add Menu Items</p>
            <SearchSelect
              value=""
              onValueChange={handleAddItem}
              items={(availableMenu || []).map(m => ({ id: m.id, label: `${m.name} (₹${m.price})` }))}
              placeholder="Search and select to add to order..."
              searchPlaceholder="Search menu..."
            />
          </div>

          {/* Cart Items */}
          {draftItems.length > 0 && (
            <div className="space-y-3 mt-4">
              {draftItems.map((item, index) => (
                <div key={`${item.menuItemId}-${index}-${item.size}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="font-semibold text-lg">{item.name}</p>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={item.size === 'Full' ? 'default' : 'outline'}
                        onClick={() => updateDraftSize(index, 'Full')}
                      >
                        Full
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.size === 'Half' ? 'default' : 'outline'}
                        onClick={() => updateDraftSize(index, 'Half')}
                      >
                        Half
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <p className="font-bold text-xl min-w-[80px] text-left sm:text-right">₹{calculateItemPrice(item)}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md overflow-hidden bg-background">
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => updateDraftQuantity(index, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => updateDraftQuantity(index, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => removeDraftItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {draftItems.length === 0 && (
            <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No menu items added yet. Search above to add items to your order.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4 justify-end">
            <Button type="button" disabled={draftItems.length === 0 || creatingOrder} onClick={onCreateOrder} className="w-full sm:w-auto">
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
                      <p className="font-semibold">{session?.tableNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Session {session?.id} · Started {session?.createdAt ? new Date(session.createdAt).toLocaleTimeString() : "N/A"}
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
                            {order?.items?.map((i: any) => `${i?.menuItemName ?? "Unknown"} x${i?.quantity ?? 0}`).join(", ") ?? ""}
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
                    {order?.sessionId ? (
                      <span className="block text-xs text-muted-foreground">
                        Session: {order?.sessionId}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {order?.orderType === "table"
                      ? `Table ${order?.tableNumber ?? "-"}`
                      : order?.orderType === "takeaway"
                        ? "Takeaway"
                        : "Delivery"}
                  </TableCell>
                  <TableCell>
                    {order?.items
                      ?.map((item: any) => `${item?.menuItemName ?? "Unknown"} x${item?.quantity ?? 0}`)
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
