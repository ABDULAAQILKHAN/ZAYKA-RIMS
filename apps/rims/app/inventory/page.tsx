import { Button } from "@zayka/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@zayka/ui"
import { Plus } from "lucide-react"

export default function InventoryPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your restaurant inventory items and stock levels.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No inventory items found. Add your first item to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
