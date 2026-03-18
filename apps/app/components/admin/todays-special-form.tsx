"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCreateTodaysSpecialMutation,
  useUpdateTodaysSpecialMutation,
  useGetTodaysSpecialByIdQuery
} from "@/store/offersApi"
import { deleteImage, getImagePathFromUrl } from "@/lib/supabase/storage"
import toast from "react-hot-toast"

interface TodaysSpecialFormProps {
  specialId?: string | null
  onClose: () => void
}

const categories = [
  "Appetizer",
  "Main Course", 
  "Rice",
  "Bread",
  "Dessert",
  "Beverage"
]

export function TodaysSpecialForm({ specialId, onClose }: TodaysSpecialFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    isVeg: true,
    isActive: true
  })
  const [newlyUploadedImage, setNewlyUploadedImage] = useState<string | null>(null)

  const { data: existingSpecial } = useGetTodaysSpecialByIdQuery(specialId!, {
    skip: !specialId
  })

  const [createSpecial, { isLoading: isCreating }] = useCreateTodaysSpecialMutation()
  const [updateSpecial, { isLoading: isUpdating }] = useUpdateTodaysSpecialMutation()

  useEffect(() => {
    if (existingSpecial) {
      setFormData({
        name: existingSpecial.name,
        description: existingSpecial.description,
        price: existingSpecial.price,
        image: existingSpecial.image,
        category: existingSpecial.category,
        isVeg: existingSpecial.isVeg,
        isActive: existingSpecial.isActive
      })
    }
  }, [existingSpecial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category) {
      toast.error("Please select a category")
      return
    }
    
    if (!formData.image) {
      toast.error("Please upload an image")
      return
    }
    
    try {
      if (specialId) {
        await updateSpecial({ id: specialId, ...formData }).unwrap()
        toast.success("Special item updated successfully")
      } else {
        await createSpecial(formData).unwrap()
        toast.success("Special item created successfully")
      }
      setNewlyUploadedImage(null) // Clear tracking on success
      onClose()
    } catch (error) {
      toast.error("Failed to save special item")
      
      // Cleanup newly uploaded image if API call failed
      if (newlyUploadedImage) {
        try {
          const imagePath = getImagePathFromUrl(newlyUploadedImage)
          if (imagePath) {
            await deleteImage(imagePath)
            console.log("Cleaned up uploaded image due to API failure")
          }
          setFormData(prev => ({ ...prev, image: existingSpecial?.image || "" }))
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {specialId ? "Edit Special Item" : "Create Special Item"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter item description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <ImageUpload
              value={formData.image}
              onChange={handleImageChange}
              folder="todays-special"
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              maxSizeMB={5}
            />
          </div>

          <div className="flex items-center justify-between">
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
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : specialId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
