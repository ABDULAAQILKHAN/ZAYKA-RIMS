import { Button } from "@zayka/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@zayka/ui"
import { Plus } from "lucide-react"

export default function MenuManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Menu Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage menu items, categories, and pricing.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No menu items found. Add your first menu item to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
