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
import { useGetIngredientsQuery, useGetMenuItemsQuery, useMapRecipeMutation } from "@/store/api"

interface RecipeDraft {
  ingredient_id: string
  quantity_required: string
}

export default function MenuPage() {
  const { data: ingredients } = useGetIngredientsQuery()
  const { data: menuItems, isLoading } = useGetMenuItemsQuery()
  const [mapRecipe, { isLoading: isSaving }] = useMapRecipeMutation()

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("")
  const [draftRecipe, setDraftRecipe] = useState<RecipeDraft[]>([
    { ingredient_id: "", quantity_required: "1" },
  ])
  const [error, setError] = useState<string | null>(null)

  const selectedMenuItem = useMemo(
    () => (menuItems ?? []).find((item) => item.id === selectedMenuItemId) ?? null,
    [menuItems, selectedMenuItemId],
  )

  const onSaveMapping = async () => {
    if (!selectedMenuItemId) {
      setError("Choose a menu item first")
      return
    }

    const normalized = draftRecipe
      .filter((row) => row.ingredient_id.trim().length > 0)
      .map((row) => ({
        ingredient_id: row.ingredient_id,
        quantity_required: Number(row.quantity_required),
      }))

    setError(null)

    try {
      await mapRecipe({
        menu_item_id: selectedMenuItemId,
        ingredients: normalized,
      }).unwrap()
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to map ingredients"
      setError(message)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Mapping</h1>
        <p className="mt-1 text-muted-foreground">
          Map ingredients to menu items and maintain auto-availability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Map Ingredients to Menu Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Menu Item</Label>
              <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {(menuItems ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {draftRecipe.map((row, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-3">
                <Select
                  value={row.ingredient_id}
                  onValueChange={(value) =>
                    setDraftRecipe((prev) =>
                      prev.map((item, rowIndex) =>
                        rowIndex === index ? { ...item, ingredient_id: value } : item,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {(ingredients ?? []).map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  step="0.01"
                  value={row.quantity_required}
                  onChange={(event) =>
                    setDraftRecipe((prev) =>
                      prev.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, quantity_required: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Quantity required"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraftRecipe((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraftRecipe((prev) => [
                  ...prev,
                  { ingredient_id: "", quantity_required: "1" },
                ])
              }
            >
              Add Ingredient Row
            </Button>
            <Button type="button" onClick={onSaveMapping} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Mapping"}
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {selectedMenuItem ? (
            <p className="text-sm text-muted-foreground">
              Current status: {selectedMenuItem.is_available ? "Available" : "Unavailable"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Mapped Ingredients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(menuItems ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>INR {item.price}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.is_available
                          ? "rounded bg-primary/10 px-2 py-1 text-xs text-primary"
                          : "rounded bg-destructive/10 px-2 py-1 text-xs text-destructive"
                      }
                    >
                      {item.is_available ? "Available" : "Unavailable"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.recipe.length === 0
                      ? "No recipe mapping"
                      : item.recipe
                          .map((recipe) => `${recipe.ingredient_name} (${recipe.quantity_required})`)
                          .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading menu items...
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
