"use client"

import { useEffect, useMemo, useState } from "react"
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
  menuItemId: string
  name: string
  price: number
  quantity: number
  size: "Full" | "Half"
}

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

export default function TakeawayPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: menu = [] } = useGetMenuQuery()
  const { data: history = [] } = useGetOrderHistoryQuery({ orderType: "takeaway" })

  const [createTakeaway, { isLoading: creating }] = useCreateTakeawayOrderMutation()

  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [lastInvoice, setLastInvoice] = useState<InvoiceRecord | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const availableMenu = useMemo(() => (menu?.length > 0 ? menu?.filter((item) => item?.isAvailable) : []), [menu])

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

  const onPlaceAndBill = async () => {
    setFormError(null)
    setLastInvoice(null)

    const normalizedItems = draftItems.map((row) => ({
      menuItemId: row.menuItemId,
      quantity: row.quantity,
      size: row.size,
    }))

    if (normalizedItems.length === 0) {
      setFormError("Please add at least one menu item")
      return
    }

    try {
      const result = await createTakeaway({
        orderType: "takeaway",
        items: normalizedItems,
      }).unwrap()
      setLastInvoice(result.invoice)
      setDraftItems([])
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
            Search and select items to add to the order. Invoice is generated immediately upon placing the order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Add Menu Items</p>
            <SearchSelect
              value=""
              onValueChange={handleAddItem}
              items={(availableMenu || []).map(m => ({ id: m.id, label: `${m.name} (₹${m.price})` }))}
              placeholder="Search dishes to add..."
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
              <p className="text-muted-foreground">No menu items added yet. Search above to start your order.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4 justify-end">
            <Button type="button" disabled={draftItems.length === 0 || creating} onClick={onPlaceAndBill} className="w-full sm:w-auto px-8">
              {creating ? "Processing..." : "Place & Bill Order"}
            </Button>
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p>Subtotal: ₹{subtotalPreview}</p>
            <p>GST (5%): ₹{gstPreview}</p>
            <p className="font-bold text-base">Total: ₹{totalPreview}</p>
          </div>

          {formError ? <p className="text-sm text-destructive font-medium">{formError}</p> : null}
        </CardContent>
      </Card>

      {/* Last Invoice */}
      {lastInvoice ? (
        <Card className="border-green-500/50 bg-green-50/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-green-600">Invoice Generated ✓</CardTitle>
              <CardDescription>The order has been recorded and billed.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => window.print()}>
              Print Invoice
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm bg-background space-y-1">
              <p className="font-bold">Zayka Darbar</p>
              <hr className="my-2" />
              <p>Invoice ID: <span className="font-mono">{lastInvoice.id}</span></p>
              {lastInvoice.orderId ? <p>Order ID: <span className="font-mono">{lastInvoice.orderId}</span></p> : null}
              <p>Type: Takeaway</p>
              <p>Date: {new Date(lastInvoice.createdAt).toLocaleString()}</p>
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
                {lastInvoice.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.menuItemName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unitPrice}</TableCell>
                    <TableCell>₹{item.lineTotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="ml-auto max-w-xs space-y-1 rounded-md border p-3 text-sm bg-background">
              <p>Subtotal: ₹{lastInvoice.subtotal}</p>
              <p>GST (5%): ₹{lastInvoice.gst}</p>
              <p className="text-base font-bold">Grand Total: ₹{lastInvoice.total}</p>
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                    No takeaway orders yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {history.length > 0 && history.slice(0, 10).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    {(order.items || [])
                      .map((item) => `${item?.menuItemName ?? "Unknown"} x${item?.quantity ?? 0}`)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="font-semibold">₹{(order.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
