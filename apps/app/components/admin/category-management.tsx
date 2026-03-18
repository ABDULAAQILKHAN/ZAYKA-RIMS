"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoryForm } from "./category-form"
import {
    useGetMenuCategoriesQuery,
    useDeleteMenuCategoryMutation,
    type MenuCategory
} from "@/store/menuApi"
import { deleteImage, getImagePathFromUrl } from "@/lib/supabase/storage"
import toast from "react-hot-toast"

export default function CategoryManagement() {
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

    const { data: categories = [], isLoading } = useGetMenuCategoriesQuery()
    const [deleteCategory] = useDeleteMenuCategoryMutation()

    const filteredCategories = categories.filter(
        (category) =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handleDeleteCategory = async (category: MenuCategory) => {
        if (confirm("Are you sure you want to delete this category?")) {
            try {
                if (category.image) {
                    const imagePath = getImagePathFromUrl(category.image)
                    if (imagePath) {
                        await deleteImage(imagePath)
                    }
                }

                await deleteCategory(category.id).unwrap()
                toast.success("Category deleted successfully!")
            } catch (error) {
                toast.error("Failed to delete category")
                console.error("Delete error:", error)
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
                    <p className="text-muted-foreground mt-2">Add, edit, and manage menu categories</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredCategories.map((category) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className={`overflow-hidden ${!category.isActive ? 'opacity-60' : ''}`}>
                                <div className="relative h-48">
                                    <Image src={category.image || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
                                    <div className="absolute top-2 left-2">
                                        {!category.isActive && (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary">Order: {category.sortOrder}</Badge>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{category.name}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description || "No description"}</p>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingCategoryId(category.id)}
                                        >
                                            <Edit className="h-3 w-3 mr-1" /> Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(category)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {!isLoading && filteredCategories.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No categories found.</p>
                </div>
            )}

            {/* Add/Edit Dialog */}
            {(isAddDialogOpen || editingCategoryId) && (
                <CategoryForm
                    categoryId={editingCategoryId}
                    onClose={() => {
                        setIsAddDialogOpen(false)
                        setEditingCategoryId(null)
                    }}
                />
            )}
        </div>
    )
}
