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
  useCreateSpecialOfferMutation,
  useUpdateSpecialOfferMutation,
  useGetSpecialOfferByIdQuery
} from "@/store/offersApi"
import { deleteImage, getImagePathFromUrl } from "@/lib/supabase/storage"
import toast from "react-hot-toast"

interface SpecialOfferFormProps {
  offerId?: string | null
  onClose: () => void
}

export function SpecialOfferForm({ offerId, onClose }: SpecialOfferFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "/menu",
    isActive: true
  })
  const [newlyUploadedImage, setNewlyUploadedImage] = useState<string | null>(null)

  const { data: existingOffer } = useGetSpecialOfferByIdQuery(offerId!, {
    skip: !offerId
  })

  const [createOffer, { isLoading: isCreating }] = useCreateSpecialOfferMutation()
  const [updateOffer, { isLoading: isUpdating }] = useUpdateSpecialOfferMutation()

  useEffect(() => {
    if (existingOffer) {
      setFormData({
        title: existingOffer.title,
        description: existingOffer.description,
        image: existingOffer.image,
        link: existingOffer.link || "/menu",
        isActive: existingOffer.isActive
      })
    }
  }, [existingOffer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.image) {
      toast.error("Please upload an image")
      return
    }
    
    try {
      if (offerId) {
        await updateOffer({ id: offerId, ...formData }).unwrap()
        toast.success("Special offer updated successfully")
      } else {
        await createOffer(formData).unwrap()
        toast.success("Special offer created successfully")
      }
      setNewlyUploadedImage(null) // Clear tracking on success
      onClose()
    } catch (error) {
      toast.error("Failed to save special offer")
      
      // Cleanup newly uploaded image if API call failed
      if (newlyUploadedImage) {
        try {
          const imagePath = getImagePathFromUrl(newlyUploadedImage)
          if (imagePath) {
            await deleteImage(imagePath)
            console.log("Cleaned up uploaded image due to API failure")
          }
          setFormData(prev => ({ ...prev, image: existingOffer?.image || "" }))
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
            {offerId ? "Edit Special Offer" : "Create Special Offer"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter offer title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter offer description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <ImageUpload
              value={formData.image}
              onChange={handleImageChange}
              folder="special-offers"
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              maxSizeMB={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => handleInputChange("link", e.target.value)}
              placeholder="Enter link URL"
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
              {isCreating || isUpdating ? "Saving..." : offerId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
