"use client"

import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zayka/ui"
import {
  useCloseTableSessionMutation,
  useGetTableSessionsQuery,
  type InvoiceRecord,
  type TableSession,
  type OrderRecord,
} from "@/store/api"

export default function BillingPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: sessions = [], isLoading: sessionsLoading } = useGetTableSessionsQuery()
  const [closeSession, { isLoading: closingSession }] = useCloseTableSessionMutation()

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceRecord | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const selectedSession = sessions.length > 0 &&sessions?.find((s) => s?.id === selectedSessionId) as
    | (TableSession & { orders: OrderRecord[] })
    | undefined

  const onSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setGeneratedInvoice(null)
  }

  const onCloseAndBill = async () => {
    if (!selectedSessionId) return

    try {
      const invoice = await closeSession({ session_id: selectedSessionId }).unwrap()
      setGeneratedInvoice(invoice)
    } catch {
      // Error handled by RTK Query
    }
  }

  // Compute aggregated items from all orders for preview
  const aggregatedItems = selectedSession
    ? (() => {
        const itemMap = new Map<
          string,
          {
            id: string
            menu_item_id: string
            menu_item_name: string
            quantity: number
            unit_price: number
            line_total: number
          }
        >()

        selectedSession.orders?.forEach((order) => {
          order.items?.forEach((item) => {
            const existing = itemMap.get(item.menu_item_id)
            if (existing) {
              existing.quantity += item.quantity
              existing.line_total += item.line_total
            } else {
              itemMap.set(item.menu_item_id, { ...item })
            }
          })
        })

        return Array.from(itemMap.values())
      })()
    : []

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="mt-1 text-muted-foreground">
          Close table sessions and generate consolidated invoices. For takeaway billing, use the Takeaway page.
        </p>
      </div>

      {/* Occupied Tables Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Occupied Tables</CardTitle>
          <CardDescription>
            Select a table to view its session details and generate the bill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No occupied tables at the moment. All tables are available.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.length > 0 && sessions?.map((session) => {
                const isSelected = selectedSessionId === session?.id
                const duration = session?.created_at 
                  ? Math.round((Date.now() - new Date(session.created_at).getTime()) / 60000)
                  : 0

                return (
                  <button
                    key={session?.id}
                    type="button"
                    onClick={() => onSelectSession(session?.id)}
                    className={`cursor-pointer rounded-lg border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">{session?.tableNumber ?? "Unknown"}</p>
                      <Badge variant="default">Occupied</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>
                        {session?.orders?.length ?? 0} order{(session?.orders?.length ?? 0) !== 1 ? "s" : ""} · {duration} min
                      </p>
                      <p className="font-semibold text-foreground">₹{(session?.total ?? 0).toFixed(2)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Panel */}
      {selectedSession && !generatedInvoice ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedSession.tableNumber} — Session Details</CardTitle>
                <CardDescription>
                  Session {selectedSession.id} · Started{" "}
                  {selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleTimeString() : "N/A"}
                </CardDescription>
              </div>
              <Button onClick={onCloseAndBill} disabled={closingSession}>
                {closingSession ? "Generating..." : "Generate Invoice & Close Table"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Individual Orders */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Orders in this session
              </h3>
              {selectedSession.orders?.map((order, idx) => (
                <div key={order?.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Order {idx + 1} — #{order?.id}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {order?.status}
                      </Badge>
                      <span className="text-sm font-medium">₹{(order?.total ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order?.items?.map((i: any) => `${i?.menu_item_name ?? "Unknown"} x${i?.quantity ?? 0}`).join(" · ") ?? ""}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placed at {order?.created_at ? new Date(order.created_at).toLocaleTimeString() : "N/A"}
                  </p>
                </div>
              ))}
            </div>

            {/* Consolidated Bill Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Consolidated Bill Preview
              </h3>
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
                  {aggregatedItems.map((item) => (
                    <TableRow key={item.menu_item_id}>
                      <TableCell>{item.menu_item_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.unit_price}</TableCell>
                      <TableCell>₹{item.line_total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="ml-auto max-w-xs space-y-1 rounded-md border p-3 text-sm">
                <p>Subtotal: ₹{(selectedSession.subtotal ?? 0).toFixed(2)}</p>
                <p>GST (5%): ₹{(selectedSession.gst ?? 0).toFixed(2)}</p>
                <p className="text-base font-bold">Grand Total: ₹{(selectedSession.total ?? 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Generated Invoice */}
      {generatedInvoice ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Invoice Generated ✓</CardTitle>
              <CardDescription>
                Table has been closed. Invoice is ready to print.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                Print Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSessionId(null)
                  setGeneratedInvoice(null)
                }}
              >
                Done
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm space-y-1">
              <p className="text-lg font-bold">Zayka Darbar</p>
              <hr className="my-2" />
              <p>Invoice ID: {generatedInvoice.id}</p>
              {generatedInvoice.session_id ? (
                <p>Session ID: {generatedInvoice.session_id}</p>
              ) : null}
              {generatedInvoice.tableNumber ? (
                <p>Table: {generatedInvoice.tableNumber}</p>
              ) : null}
              <p>Type: {generatedInvoice.order_type}</p>
              <p>Date: {generatedInvoice.created_at ? new Date(generatedInvoice.created_at).toLocaleString() : "N/A"}</p>
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
                {generatedInvoice.items?.map((item) => (
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
              <p>Subtotal: ₹{generatedInvoice.subtotal}</p>
              <p>GST (5%): ₹{generatedInvoice.gst}</p>
              <p className="text-base font-bold">Grand Total: ₹{generatedInvoice.total}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
