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
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useGetOrdersQuery,
} from "@/store/api"
import { Plus } from "lucide-react"

const GST_DEFAULT = 5

export default function BillingPage() {
  const { data: rawInvoices, isLoading } = useGetInvoicesQuery()
  const { data: rawOrders } = useGetOrdersQuery()

  const invoices = Array.isArray(rawInvoices) ? rawInvoices : []
  const orders = Array.isArray(rawOrders) ? rawOrders : []
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation()

  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [gstPercent, setGstPercent] = useState(GST_DEFAULT)

  // Orders without an invoice
  const uninvoicedOrders = orders.filter(
    (o) => o.status === "completed" && !invoices.some((inv) => inv.orderId === o.id)
  )

  const handleCreate = async () => {
    if (!orderId) return
    await createInvoice({ orderId, gstPercent })
    setOpen(false)
    setOrderId("")
  }

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0)
  const pending = invoices.filter((i) => i.status === "pending")
  const paid = invoices.filter((i) => i.status === "paid")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing / Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Generate invoices with GST calculation.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Completed Order</Label>
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {uninvoicedOrders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.id.slice(0, 8)} — {formatCurrency(o.total)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>GST %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={creating || !orderId}>
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">from paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground">awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paid.length}</div>
            <p className="text-xs text-muted-foreground">invoices collected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{inv.orderId.slice(0, 8)}</TableCell>
                    <TableCell>{formatCurrency(inv.subtotal)}</TableCell>
                    <TableCell>
                      {inv.gstPercent}% ({formatCurrency(inv.gstAmount)})
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(inv.total)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "secondary" : "destructive"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
