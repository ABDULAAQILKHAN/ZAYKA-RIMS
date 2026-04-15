"use client"

import { useEffect, useState } from "react"
import {
  Badge,
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
} from "@zayka/ui"
import { useGetOrderHistoryQuery, useGetTablesQuery } from "@/store/api"

export default function HistoryPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [date, setDate] = useState("")
  const [tableId, setTableId] = useState("all")
  const [orderType, setOrderType] = useState<"all" | "table" | "delivery" | "takeaway">("all")

  const { data: tables = [] } = useGetTablesQuery()
  const { data: history = [], isLoading } = useGetOrderHistoryQuery({
    date: date || undefined,
    table_id: tableId === "all" ? undefined : tableId,
    order_type: orderType,
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
        <p className="mt-1 text-muted-foreground">
          Review past orders with date, table, and order type filters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Date</p>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Table</p>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {tables?.length > 0 && tables.map((table) => (
                  <SelectItem key={table?.id} value={table?.id}>
                    {table?.table_number ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Order Type</p>
            <Select value={orderType} onValueChange={(value) => setOrderType(value as typeof orderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Table / Session</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.length > 0 && history.map((order) => (
                <TableRow key={order?.id}>
                  <TableCell className="font-medium">{order?.id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order?.order_type === "table"
                          ? "default"
                          : order?.order_type === "takeaway"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {order?.order_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order?.table_number ?? "-"}
                    {order?.session_id ? (
                      <span className="block text-xs text-muted-foreground">
                        {order?.session_id}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order?.items
                      ?.map((item: any) => `${item?.menu_item_name ?? "Unknown"} x${item?.quantity ?? 0}`)
                      .join(", ") ?? ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order?.status}</Badge>
                  </TableCell>
                  <TableCell>₹{(order?.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{order?.created_at ? new Date(order.created_at).toLocaleString() : "N/A"}</TableCell>
                </TableRow>
              ))}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading order history...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && history?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders found for the selected filters.
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
