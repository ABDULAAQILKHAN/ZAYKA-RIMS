"use client"

import { useState } from "react"
import { useGetMenuItemsQuery, useToggleMenuItemAvailabilityMutation } from "@/store/menuApi"
import { formatCurrency } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function StaffMenuManagement() {
    const { data: menuItems = [], isLoading } = useGetMenuItemsQuery({})
    const [toggleAvailability] = useToggleMenuItemAvailabilityMutation()
    const [searchQuery, setSearchQuery] = useState("")

    const filteredItems = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
        try {
            await toggleAvailability({ id, isAvailable: !currentStatus }).unwrap()
            toast.success("Item availability updated")
        } catch (error) {
            toast.error("Failed to update availability")
        }
    }

    if (isLoading) {
        return <div>Loading menu items...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Menu Management</h2>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search menu items..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Availability</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div>Full: {formatCurrency(item.fullPrice)}</div>
                                            {item.halfPrice && <div className="text-xs text-muted-foreground">Half: {formatCurrency(item.halfPrice)}</div>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                            {item.isAvailable ? "Available" : "Unavailable"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={item.isAvailable}
                                            onCheckedChange={() => handleToggleAvailability(item.id, item.isAvailable)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
