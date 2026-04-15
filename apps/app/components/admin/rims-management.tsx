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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zayka/ui"

type TableDraft = {
  tableNumber: string
  seats: string
  tableNearWindow: boolean
  status: 'available' | 'occupied' | 'reserved'
}

function TableFormDialog({
  existingTables,
  table,
  onSave,
  isSaving,
}: {
  existingTables: DiningTable[]
  table?: DiningTable
  onSave: (payload: any, isEdit: boolean) => Promise<void>
  isSaving: boolean
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEdit = Boolean(table)

  const [draft, setDraft] = useState<TableDraft>({
    tableNumber: table?.tableNumber != null ? String(table.tableNumber) : "",
    seats: table?.seats != null ? String(table.seats) : "",
    tableNearWindow: table?.tableNearWindow || false,
    status: table?.status || "available",
  })

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
      seats: table?.seats != null ? String(table.seats) : "",
      tableNearWindow: table?.tableNearWindow || false,
      status: table?.status || "available",
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
    
    if (isEdit) {
      // Backend contract for patching specific Table only requires Status.
      await onSave({ status: draft.status }, isEdit)
      setOpen(false)
      return
    }

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

    if (normalizedTableNumbers && (normalizedTableNumbers as number[]).length > 0 && (normalizedTableNumbers as number[]).includes(parsedTableNumber)) {
      setError("Table number must be unique")
      return
    }

    const payload: any = {
      tableNumber: parsedTableNumber,
      tableNearWindow: draft.tableNearWindow,
    }

    const parsedSeats =
      draft.seats.trim().length > 0 ? Number(draft.seats) : undefined
    if (
      draft.seats.trim().length > 0 &&
      (typeof parsedSeats !== "number" || Number.isNaN(parsedSeats) || parsedSeats <= 0)
    ) {
      setError("Seats must be a positive number")
      return
    }
    if (parsedSeats !== undefined) payload.seats = parsedSeats

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
          <DialogTitle>{isEdit ? "Edit Table Status" : "Create Table"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update table status. According to the architecture rules, table numbers and physical capacity cannot be changed after initial setup."
              : "Maintain dining table metadata for RIMS operations."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <>
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

              <div className="space-y-2">
                <Label htmlFor="seats">Seats (Optional, Default is 4)</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  value={draft.seats}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, seats: event.target.value }))
                  }
                  placeholder="4"
                />
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="tableNearWindow"
                  className="h-4 w-4 rounded border-gray-300 text-zayka-600 focus:ring-zayka-600"
                  checked={draft.tableNearWindow}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDraft((prev) => ({ ...prev, tableNearWindow: e.target.checked }))
                  }
                />
                <Label
                  htmlFor="tableNearWindow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Table near window
                </Label>
              </div>
            </>
          )}

          {isEdit && (
            <div className="space-y-2">
              <Label>Table Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value: 'available' | 'occupied' | 'reserved') =>
                  setDraft((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
                <TableHead>Seats</TableHead>
                <TableHead>Window Side</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length > 0 && tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.tableNumber}</TableCell>
                  <TableCell>{table.seats ?? 4}</TableCell>
                  <TableCell>{table.tableNearWindow ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant={table.status === "available" ? "outline" : table.status === "occupied" ? "secondary" : "default"}>
                      {table.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{table.activeOrderCount}</TableCell>
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
