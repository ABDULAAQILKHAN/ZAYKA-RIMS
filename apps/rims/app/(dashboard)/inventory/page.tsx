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
} from "@zayka/ui"
import { formatCurrency } from "@zayka/utils"
import { useGetIngredientsQuery, useCreateIngredientMutation, useUpdateIngredientMutation } from "@/store/api"
import { Plus, Pencil } from "lucide-react"
import type { Ingredient } from "@zayka/types"

const EMPTY_FORM = { name: "", unit: "kg", currentStock: 0, minStock: 0, costPerUnit: 0 }

export default function InventoryPage() {
  const { data: rawIngredients, isLoading } = useGetIngredientsQuery()
  const ingredients = Array.isArray(rawIngredients) ? rawIngredients : []
  const [createIngredient, { isLoading: creating }] = useCreateIngredientMutation()
  const [updateIngredient, { isLoading: updating }] = useUpdateIngredientMutation()

  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleOpenNew = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setOpen(true)
  }

  const handleEdit = (item: Ingredient) => {
    setForm({
      name: item.name,
      unit: item.unit,
      currentStock: item.currentStock,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit,
    })
    setEditId(item.id)
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return

    if (editId) {
      await updateIngredient({ id: editId, data: form })
    } else {
      await createIngredient(form)
    }
    setOpen(false)
    setForm(EMPTY_FORM)
    setEditId(null)
  }

  const lowStock = ingredients.filter((i) => i.currentStock <= i.minStock)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage ingredients and stock levels.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tomatoes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="kg, litres, pcs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerUnit">Cost / Unit</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    min={0}
                    value={form.costPerUnit}
                    onChange={(e) => setForm((f) => ({ ...f, costPerUnit: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min={0}
                    value={form.currentStock}
                    onChange={(e) => setForm((f) => ({ ...f, currentStock: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min={0}
                    value={form.minStock}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={creating || updating}>
                {editId ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Low Stock Alerts ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((item) => (
                <Badge key={item.id} variant="destructive">
                  {item.name}: {item.currentStock} {item.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ingredients yet. Add your first ingredient to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Cost / Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                    <TableCell>
                      {item.currentStock <= item.minStock ? (
                        <Badge variant="destructive">Low</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
