"use client"

import { useMemo, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zayka/ui"
import {
  useCreateIngredientMutation,
  useGetIngredientsQuery,
  useUpdateIngredientStockMutation,
} from "@/store/api"

export default function InventoryPage() {
  const { data: ingredients, isLoading } = useGetIngredientsQuery()
  const [createIngredient, { isLoading: creating }] = useCreateIngredientMutation()
  const [updateStock, { isLoading: updating }] = useUpdateIngredientStockMutation()

  const [form, setForm] = useState({
    name: "",
    unit: "",
    current_stock: "0",
    min_stock: "0",
  })
  const [error, setError] = useState<string | null>(null)
  const [draftStockById, setDraftStockById] = useState<Record<string, string>>({})

  const lowStockCount = useMemo(
    () =>
      (ingredients ?? []).filter((ingredient) => ingredient.current_stock <= ingredient.min_stock)
        .length,
    [ingredients],
  )

  const onCreate = async () => {
    setError(null)
    try {
      await createIngredient({
        name: form.name.trim(),
        unit: form.unit.trim(),
        current_stock: Number(form.current_stock),
        min_stock: Number(form.min_stock),
      }).unwrap()

      setForm({
        name: "",
        unit: "",
        current_stock: "0",
        min_stock: "0",
      })
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to create ingredient"

      setError(message)
    }
  }

  const onSaveStock = async (id: string, minStock: number) => {
    const value = Number(draftStockById[id])
    if (Number.isNaN(value)) {
      return
    }

    await updateStock({ id, current_stock: value, min_stock: minStock }).unwrap()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 text-muted-foreground">
            Track ingredients, current stock, and low stock alerts.
          </p>
        </div>
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Low stock items: {lowStockCount}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Ingredient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Tomato"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, unit: event.target.value }))
                }
                placeholder="kg / litre / pcs"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <Input
                type="number"
                value={form.current_stock}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, current_stock: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock</Label>
              <Input
                type="number"
                value={form.min_stock}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, min_stock: event.target.value }))
                }
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            onClick={onCreate}
            disabled={creating || form.name.trim().length === 0 || form.unit.trim().length === 0}
          >
            {creating ? "Creating..." : "Create Ingredient"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ingredients ?? []).map((ingredient) => {
                const isLow = ingredient.current_stock <= ingredient.min_stock

                return (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell>{ingredient.current_stock}</TableCell>
                    <TableCell>{ingredient.min_stock}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isLow
                            ? "rounded bg-destructive/10 px-2 py-1 text-xs text-destructive"
                            : "rounded bg-primary/10 px-2 py-1 text-xs text-primary"
                        }
                      >
                        {isLow ? "Low" : "Healthy"}
                      </span>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={draftStockById[ingredient.id] ?? String(ingredient.current_stock)}
                        onChange={(event) =>
                          setDraftStockById((prev) => ({
                            ...prev,
                            [ingredient.id]: event.target.value,
                          }))
                        }
                        className="w-24"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={updating}
                        onClick={() => onSaveStock(ingredient.id, ingredient.min_stock)}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading ingredients...
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
