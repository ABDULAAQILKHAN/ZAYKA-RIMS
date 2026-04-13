"use client"

import {
  Button,
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
} from "@zayka/ui"
import { useCreateInvoiceMutation, useGetInvoicesQuery, useGetOrdersQuery } from "@/store/api"

export default function BillingPage() {
  const { data: orders } = useGetOrdersQuery()
  const { data: invoices, isLoading } = useGetInvoicesQuery()
  const [createInvoice, { isLoading: generating }] = useCreateInvoiceMutation()

  const uninvoicedDeliveredOrders = (orders ?? []).filter(
    (order) =>
      order.status === "delivered" &&
      !(invoices ?? []).some((invoice) => invoice.order_id === order.id),
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Generate invoices with subtotal, GST, and total.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {uninvoicedDeliveredOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No delivered orders pending invoice generation.
            </p>
          ) : (
            uninvoicedDeliveredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    Subtotal INR {order.subtotal} | GST INR {order.gst} | Total INR {order.total}
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={generating}
                  onClick={() => createInvoice({ order_id: order.id })}
                >
                  Generate Invoice
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoices ?? []).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id.slice(0, 8)}</TableCell>
                  <TableCell>{invoice.order_id.slice(0, 8)}</TableCell>
                  <TableCell>INR {invoice.subtotal}</TableCell>
                  <TableCell>INR {invoice.gst}</TableCell>
                  <TableCell>INR {invoice.total}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                </TableRow>
              ))}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading invoices...
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
