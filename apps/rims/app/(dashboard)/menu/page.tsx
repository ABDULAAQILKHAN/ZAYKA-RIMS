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
  useGetMenuItemsQuery,
  useGetRecipesQuery,
  useGetIngredientsQuery,
  useCreateRecipeMutation,
  useDeleteRecipeMutation,
} from "@/store/api"
import { Plus, Trash2, Link2 } from "lucide-react"
import type { MenuItem, Recipe, Ingredient } from "@zayka/types"

export default function MenuManagementPage() {
  const { data: rawMenuItems, isLoading: menuLoading } = useGetMenuItemsQuery()
  const { data: rawRecipes, isLoading: recipesLoading } = useGetRecipesQuery()
  const { data: rawIngredients } = useGetIngredientsQuery()

  const menuItems = Array.isArray(rawMenuItems) ? rawMenuItems : []
  const recipes = Array.isArray(rawRecipes) ? rawRecipes : []
  const ingredients = Array.isArray(rawIngredients) ? rawIngredients : []
  const [createRecipe, { isLoading: creatingRecipe }] = useCreateRecipeMutation()
  const [deleteRecipe] = useDeleteRecipeMutation()

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [mappingOpen, setMappingOpen] = useState(false)
  const [ingredientId, setIngredientId] = useState("")
  const [qty, setQty] = useState(1)

  // Calculate availability based on ingredient stock vs recipe requirements
  const getAvailability = (menuItemId: string) => {
    const itemRecipes = recipes.filter((r) => r.menuItemId === menuItemId)
    if (itemRecipes.length === 0) return { available: true, reason: "No recipe defined" }

    for (const recipe of itemRecipes) {
      const ingredient = ingredients.find((i) => i.id === recipe.ingredientId)
      if (!ingredient) return { available: false, reason: "Missing ingredient data" }
      if (ingredient.currentStock < recipe.quantityRequired) {
        return { available: false, reason: `${ingredient.name} stock too low` }
      }
    }
    return { available: true, reason: "In stock" }
  }

  const handleAddMapping = async () => {
    if (!selectedItem || !ingredientId || qty <= 0) return
    await createRecipe({
      menuItemId: selectedItem.id,
      ingredientId,
      quantityRequired: qty,
    })
    setIngredientId("")
    setQty(1)
  }

  const openMappingDialog = (item: MenuItem) => {
    setSelectedItem(item)
    setMappingOpen(true)
  }

  const itemRecipes = selectedItem
    ? recipes.filter((r) => r.menuItemId === selectedItem.id)
    : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
        <p className="text-muted-foreground mt-1">
          View menu items, map ingredients, and check availability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {menuLoading || recipesLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : menuItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No menu items found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Ingredients</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => {
                  const { available, reason } = getAvailability(item.id)
                  const count = recipes.filter((r) => r.menuItemId === item.id).length
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={available ? "secondary" : "destructive"}>
                          {available ? "Available" : "Unavailable"}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{reason}</span>
                      </TableCell>
                      <TableCell>{count} mapped</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openMappingDialog(item)}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ingredient Mapping Dialog */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Ingredient Mapping — {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Existing mappings */}
          {itemRecipes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Qty Required</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemRecipes.map((r) => {
                  const ing = ingredients.find((i) => i.id === r.ingredientId)
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{ing?.name ?? r.ingredientId}</TableCell>
                      <TableCell>
                        {r.quantityRequired} {ing?.unit}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteRecipe(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Add mapping */}
          <div className="flex items-end gap-3 pt-2">
            <div className="flex-1 space-y-2">
              <Label>Ingredient</Label>
              <Select value={ingredientId} onValueChange={setIngredientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-2">
              <Label>Qty</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleAddMapping} disabled={creatingRecipe || !ingredientId}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
