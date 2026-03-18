import { Button } from "@zayka/ui"
import { formatCurrency } from "@zayka/utils"
import type { InventoryItem } from "@zayka/types"

export default function RIMSHomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Zayka RIMS
            </h1>
            <p className="text-muted-foreground mt-1">
              Restaurant Inventory Management System
            </p>
          </div>
          <Button>Add Inventory Item</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Low Stock Alerts</h3>
            <p className="text-3xl font-bold mt-2 text-destructive">0</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(0)}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory Items</h2>
          <p className="text-muted-foreground">
            No inventory items yet. Add your first item to get started.
          </p>
        </div>
      </div>
    </main>
  )
}
