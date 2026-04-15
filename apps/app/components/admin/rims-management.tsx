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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zayka/ui"
import { Edit, Plus, Trash2 } from "lucide-react"
import {
  type DiningTable,
  useCreateTableMutation,
  useDeleteTableMutation,
  useGetTablesQuery,
  useUpdateTableMutation,
} from "@/store/api"

type TableDraft = {
  tableNumber: string
  capacity: string
}

function TableFormDialog({
  existingTables,
  table,
  onSave,
  isSaving,
}: {
  existingTables: DiningTable[]
  table?: DiningTable
  onSave: (payload: { tableNumber: number; capacity?: number }, isEdit: boolean) => Promise<void>
  isSaving: boolean
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<TableDraft>({
    tableNumber: table?.tableNumber != null ? String(table.tableNumber) : "",
    capacity: table?.capacity != null ? String(table.capacity) : "",
  })

  const isEdit = Boolean(table)

  const normalizedTableNumbers = useMemo(
    () =>
      existingTables.length > 0 && existingTables
        .filter((entry) => entry.id !== table?.id)
        .map((entry) => entry.tableNumber),
    [existingTables, table?.id],
  )

  const resetForm = () => {
    setError(null)
    setDraft({
      tableNumber: table?.tableNumber != null ? String(table.tableNumber) : "",
      capacity: table?.capacity != null ? String(table.capacity) : "",
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      resetForm()
    }
  }

  const submit = async () => {
    setError(null)
    const tableNumberStr = draft.tableNumber.trim()

    if (!tableNumberStr) {
      setError("Table number is required")
      return
    }

    const parsedTableNumber = Number(tableNumberStr)
    if (Number.isNaN(parsedTableNumber) || parsedTableNumber < 1) {
      setError("Table number must be a positive integer (e.g. 1, 2, 12)")
      return
    }

    if (normalizedTableNumbers && normalizedTableNumbers.length > 0 && normalizedTableNumbers.includes(parsedTableNumber)) {
      setError("Table number must be unique")
      return
    }

    const payload: { tableNumber: number; capacity?: number } = {
      tableNumber: parsedTableNumber,
    }

    if (isEdit) {
      const parsedCapacity =
        draft.capacity.trim().length > 0 ? Number(draft.capacity) : undefined
      if (
        draft.capacity.trim().length > 0 &&
        (typeof parsedCapacity !== "number" || Number.isNaN(parsedCapacity) || parsedCapacity <= 0)
      ) {
        setError("Capacity must be a positive number")
        return
      }
      payload.capacity = parsedCapacity
    }

    await onSave(payload, isEdit)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Table
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Table" : "Create Table"}</DialogTitle>
          <DialogDescription>
            Maintain dining table metadata for RIMS operations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Table Number</Label>
            <Input
              id="tableNumber"
              type="number"
              min={1}
              value={draft.tableNumber}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, tableNumber: event.target.value }))
              }
              placeholder="12"
            />
          </div>

          {isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Optional)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={draft.capacity}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, capacity: event.target.value }))
                }
                placeholder="4"
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function RimsManagement() {
  const { data: tables = [], isLoading: tablesLoading } = useGetTablesQuery()

  const [createTable, { isLoading: creatingTable }] = useCreateTableMutation()
  const [updateTable, { isLoading: updatingTable }] = useUpdateTableMutation()
  const [deleteTable, { isLoading: deletingTable }] = useDeleteTableMutation()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">RIMS Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage dining tables for RIMS operations.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Dining Tables</CardTitle>
            <CardDescription>
              Create, edit, and remove tables used by dine-in order flows.
            </CardDescription>
          </div>
          <TableFormDialog
            existingTables={tables}
            isSaving={creatingTable}
            onSave={async (payload, isEdit) => {
              await createTable(payload).unwrap()
            }}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Number</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length > 0 && tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.tableNumber}</TableCell>
                  <TableCell>{table.capacity ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={table.status === "available" ? "outline" : "secondary"}>
                      {table.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{table.active_order_count}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <TableFormDialog
                      existingTables={tables}
                      table={table}
                      isSaving={updatingTable}
                      onSave={async (payload) => {
                        await updateTable({ id: table.id, ...payload }).unwrap()
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingTable}
                      onClick={() => deleteTable({ id: table.id })}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tablesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading tables...
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
