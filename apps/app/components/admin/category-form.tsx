"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    useCreateMenuCategoryMutation,
    useUpdateMenuCategoryMutation,
    useGetMenuCategoryByIdQuery,
} from "@/store/menuApi"
import { deleteImage, getImagePathFromUrl } from "@/lib/supabase/storage"
import toast from "react-hot-toast"

interface CategoryFormProps {
    categoryId?: string | null
    onClose: () => void
}

export function CategoryForm({ categoryId, onClose }: CategoryFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: "",
        isActive: true,
        sortOrder: 0,
    })

    const [newlyUploadedImage, setNewlyUploadedImage] = useState<string | null>(null)

    const { data: existingCategory } = useGetMenuCategoryByIdQuery(categoryId!, {
        skip: !categoryId
    })

    const [createCategory, { isLoading: isCreating }] = useCreateMenuCategoryMutation()
    const [updateCategory, { isLoading: isUpdating }] = useUpdateMenuCategoryMutation()

    useEffect(() => {
        if (existingCategory) {
            setFormData({
                name: existingCategory.name,
                description: existingCategory.description || "",
                image: existingCategory.image || "",
                isActive: existingCategory.isActive,
                sortOrder: existingCategory.sortOrder,
            })
        }
    }, [existingCategory])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (categoryId) {
                await updateCategory({ id: categoryId, ...formData }).unwrap()
                toast.success("Category updated successfully")
            } else {
                await createCategory(formData).unwrap()
                toast.success("Category created successfully")
            }
            setNewlyUploadedImage(null)
            onClose()
        } catch (error: any) {
            console.error("Category save error:", error)
            const errorMessage = error?.data?.error || error?.data?.message || "Failed to save category"
            toast.error(errorMessage)

            if (newlyUploadedImage) {
                try {
                    const imagePath = getImagePathFromUrl(newlyUploadedImage)
                    if (imagePath) {
                        await deleteImage(imagePath)
                    }
                    setFormData(prev => ({ ...prev, image: existingCategory?.image || "" }))
                    setNewlyUploadedImage(null)
                } catch (deleteError) {
                    console.error("Failed to cleanup image:", deleteError)
                }
            }
        }
    }

    const handleImageChange = async (newImageUrl: string) => {
        setNewlyUploadedImage(newImageUrl)
        setFormData(prev => ({ ...prev, image: newImageUrl }))
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {categoryId ? "Edit Category" : "Create Category"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Enter category name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            placeholder="Enter category description"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input
                            id="sortOrder"
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) => handleInputChange("sortOrder", parseInt(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image</Label>
                        <ImageUpload
                            value={formData.image}
                            onChange={handleImageChange}
                            folder="categories"
                            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                            maxSizeMB={5}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || isUpdating}>
                            {isCreating || isUpdating ? "Saving..." : categoryId ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
