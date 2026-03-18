"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { uploadImage, updateImage, deleteImage, getImagePathFromUrl, isSupabaseImage } from "@/lib/supabase/storage"
import type { ImageUploadResult } from "@/lib/supabase/storage"
import toast from "react-hot-toast"

interface ImageUploadProps {
  value?: string // Current image URL
  onChange: (imageUrl: string) => void
  onImagePathChange?: (imagePath: string) => void // To store the storage path separately
  folder: string // Storage folder (e.g., 'special-offers', 'todays-specials')
  label?: string
  className?: string
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export function ImageUpload({
  value,
  onChange,
  onImagePathChange,
  folder,
  label = "Upload Image",
  className = "",
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxSizeMB = 5
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Please select a valid image file (${acceptedTypes.join(", ")})`)
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image size must be less than ${maxSizeMB}MB`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      let result: ImageUploadResult

      // If updating an existing image, delete the old one
      if (value && isSupabaseImage(value)) {
        const oldImagePath = getImagePathFromUrl(value)
        result = await updateImage(file, folder, oldImagePath || undefined)
      } else {
        result = await uploadImage(file, folder)
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        onChange(result.url)
        onImagePathChange?.(result.path)
        toast.success("Image uploaded successfully!")
      } else {
        toast.error(result.error || "Failed to upload image")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      clearInterval(progressInterval)
    }
  }, [value, onChange, onImagePathChange, folder, acceptedTypes, maxSizeMB])

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle image removal
  const handleRemoveImage = async () => {
    if (!value) return

    // If it's a Supabase image, delete from storage
    if (isSupabaseImage(value)) {
      const imagePath = getImagePathFromUrl(value)
      if (imagePath) {
        const result = await deleteImage(imagePath)
        if (result.success) {
          toast.success("Image deleted successfully!")
        } else {
          toast.error("Failed to delete image from storage")
          // Still remove from form even if storage deletion fails
        }
      }
    }

    onChange("")
    onImagePathChange?.("")
  }

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      
      <Card className={`transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-dashed'}`}>
        <CardContent className="p-6">
          {value ? (
            // Show uploaded image
            <div className="space-y-4">
              <div className="relative group">
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={value}
                    alt="Uploaded image"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace Image
              </Button>
            </div>
          ) : (
            // Show upload area
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {acceptedTypes.join(", ")} up to {maxSizeMB}MB
                  </p>
                </div>
                <Button type="button" variant="outline" disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  )
}
