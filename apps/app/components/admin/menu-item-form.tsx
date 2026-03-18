"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useGetMenuItemByIdQuery,
  useGetActiveMenuCategoriesQuery,
  type MenuItem
} from "@/store/menuApi"
import { deleteImage, getImagePathFromUrl } from "@/lib/supabase/storage"
import toast from "react-hot-toast"
import { Plus, Minus } from "lucide-react"

interface MenuItemFormProps {
  itemId?: string | null
  onClose: () => void
}

export function MenuItemForm({ itemId, onClose }: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fullPrice: "" as number | string,
    halfPrice: "" as number | string,
    image: "",
    categoryId: "" as any,
    isVeg: true,
    isSpicy: false,
    isAvailable: true,
    ingredients: [] as string[],
    allergens: [] as string[],
    nutritionalInfo: {
      calories: "" as number | string,
      protein: "" as number | string,
      carbs: "" as number | string,
      fat: "" as number | string
    },
    preparationTime: "" as number | string
  })

  const [newIngredient, setNewIngredient] = useState("")
  const [newAllergen, setNewAllergen] = useState("")
  const [newlyUploadedImage, setNewlyUploadedImage] = useState<string | null>(null)

  const { data: existingItem } = useGetMenuItemByIdQuery(itemId!, {
    skip: !itemId
  })

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useGetActiveMenuCategoriesQuery()

  // Debug log to see what categories we're getting
  console.log('Categories data:', categories)

  const [createMenuItem, { isLoading: isCreating }] = useCreateMenuItemMutation()
  const [updateMenuItem, { isLoading: isUpdating }] = useUpdateMenuItemMutation()

  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name,
        description: existingItem.description,
        fullPrice: existingItem.fullPrice,
        halfPrice: existingItem.halfPrice || "",
        image: existingItem.image,
        categoryId: existingItem.categoryId || existingItem.category,
        isVeg: existingItem.isVeg,
        isSpicy: existingItem.isSpicy,
        isAvailable: existingItem.isAvailable,
        ingredients: existingItem.ingredients || [],
        allergens: existingItem.allergens || [],
        nutritionalInfo: {
          calories: existingItem.nutritionalInfo?.calories ?? 0,
          protein: existingItem.nutritionalInfo?.protein ?? 0,
          carbs: existingItem.nutritionalInfo?.carbs ?? 0,
          fat: existingItem.nutritionalInfo?.fat ?? 0
        },
        preparationTime: existingItem.preparationTime || 0
      })
    }
  }, [existingItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    /* 
    // Image is now optional
    if (!formData.image) {
      toast.error("Please upload an image")
      return
    }
    */

    if (!formData.categoryId) {
      toast.error("Please select a category")
      return
    }

    try {
      // Convert string values to numbers for API
      const submitData = {
        ...formData,
        fullPrice: typeof formData.fullPrice === 'string' ? (parseFloat(formData.fullPrice) || 0) : formData.fullPrice,
        halfPrice: formData.halfPrice ? (typeof formData.halfPrice === 'string' ? (parseFloat(formData.halfPrice) || 0) : formData.halfPrice) : undefined,
        preparationTime: typeof formData.preparationTime === 'string' ? (parseInt(formData.preparationTime) || 0) : formData.preparationTime,
        nutritionalInfo: {
          calories: typeof formData.nutritionalInfo.calories === 'string' ? (parseInt(formData.nutritionalInfo.calories) || 0) : formData.nutritionalInfo.calories,
          protein: typeof formData.nutritionalInfo.protein === 'string' ? (parseFloat(formData.nutritionalInfo.protein) || 0) : formData.nutritionalInfo.protein,
          carbs: typeof formData.nutritionalInfo.carbs === 'string' ? (parseFloat(formData.nutritionalInfo.carbs) || 0) : formData.nutritionalInfo.carbs,
          fat: typeof formData.nutritionalInfo.fat === 'string' ? (parseFloat(formData.nutritionalInfo.fat) || 0) : formData.nutritionalInfo.fat,
        }
      }

      if (itemId) {
        await updateMenuItem({ id: itemId, ...submitData }).unwrap()
        toast.success("Menu item updated successfully")
      } else {
        await createMenuItem(submitData).unwrap()
        toast.success("Menu item created successfully")
      }
      setNewlyUploadedImage(null) // Clear tracking on success
      onClose()
    } catch (error: any) {
      console.error("Menu item save error:", error)
      const errorMessage = error?.data?.error || error?.data?.message || "Failed to save menu item"
      toast.error(errorMessage)

      // Cleanup newly uploaded image if API call failed
      if (newlyUploadedImage) {
        try {
          const imagePath = getImagePathFromUrl(newlyUploadedImage)
          if (imagePath) {
            await deleteImage(imagePath)
            console.log("Cleaned up uploaded image due to API failure")
          }
          setFormData(prev => ({ ...prev, image: existingItem?.image || "" }))
          setNewlyUploadedImage(null)
        } catch (deleteError) {
          console.error("Failed to cleanup image:", deleteError)
        }
      }
    }
  }

  const handleImageChange = async (newImageUrl: string) => {
    // Track this as a newly uploaded image (for potential rollback)
    setNewlyUploadedImage(newImageUrl)

    // Note: ImageUpload component already handles old image deletion via updateImage()
    // so we don't need to delete it here to avoid double deletion

    setFormData(prev => ({ ...prev, image: newImageUrl }))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNutritionalInfoChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      nutritionalInfo: {
        ...prev.nutritionalInfo,
        [field]: value
      }
    }))
  }

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }))
      setNewIngredient("")
    }
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const addAllergen = () => {
    if (newAllergen.trim()) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, newAllergen.trim()]
      }))
      setNewAllergen("")
    }
  }

  const removeAllergen = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {itemId ? "Edit Menu Item" : "Create Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullPrice">Full Price (₹) *</Label>
              <Input
                id="fullPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.fullPrice}
                onChange={(e) => handleInputChange("fullPrice", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="halfPrice">Half Price (₹) (Optional)</Label>
              <Input
                id="halfPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.halfPrice}
                onChange={(e) => handleInputChange("halfPrice", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              {categoriesLoading ? (
                <div className="flex items-center space-x-2 p-2 border rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zayka-600"></div>
                  <span className="text-sm text-muted-foreground">Loading categories...</span>
                </div>
              ) : categoriesError ? (
                <div className="p-3 border border-red-200 rounded-md bg-red-50">
                  <p className="text-sm text-red-600">Failed to load categories. Please refresh the page.</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-3 border border-amber-200 rounded-md bg-amber-50">
                  <p className="text-sm text-amber-600">No categories available. Please create categories first.</p>
                </div>
              ) : (
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => category.id && category.id.trim() !== "")
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparationTime">Preparation Time (minutes)</Label>
              <Input
                id="preparationTime"
                value={formData.preparationTime}
                onChange={(e) => handleInputChange("preparationTime", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <ImageUpload
              value={formData.image}
              onChange={handleImageChange}
              folder="menu"
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              maxSizeMB={5}
            />
          </div>

          {/* Properties */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isVeg"
                checked={formData.isVeg}
                onCheckedChange={(checked) => handleInputChange("isVeg", checked)}
              />
              <Label htmlFor="isVeg">Vegetarian</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isSpicy"
                checked={formData.isSpicy}
                onCheckedChange={(checked) => handleInputChange("isSpicy", checked)}
              />
              <Label htmlFor="isSpicy">Spicy</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => handleInputChange("isAvailable", checked)}
              />
              <Label htmlFor="isAvailable">Available</Label>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <Label>Ingredients</Label>
            <div className="flex gap-2">
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <Button type="button" onClick={addIngredient} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm">
                    <span>{ingredient}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allergens */}
          <div className="space-y-3">
            <Label>Allergens</Label>
            <div className="flex gap-2">
              <Input
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                placeholder="Add allergen"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
              />
              <Button type="button" onClick={addAllergen} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.allergens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.allergens.map((allergen, index) => (
                  <div key={index} className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-md text-sm">
                    <span>{allergen}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllergen(index)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nutritional Information */}
          <div className="space-y-3">
            <Label>Nutritional Information (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  value={formData.nutritionalInfo.calories}
                  onChange={(e) => handleNutritionalInfoChange("calories", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.nutritionalInfo.protein}
                  onChange={(e) => handleNutritionalInfoChange("protein", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.nutritionalInfo.carbs}
                  onChange={(e) => handleNutritionalInfoChange("carbs", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.nutritionalInfo.fat}
                  onChange={(e) => handleNutritionalInfoChange("fat", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : itemId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}