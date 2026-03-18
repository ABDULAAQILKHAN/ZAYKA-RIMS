"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, Edit2, Save, X, Camera, Trash2, Loader2, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation
} from "@/store/addressApi"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  })

  // Profile picture states
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [imagePath, setImagePath] = useState<string>("")
  const [imgError, setImgError] = useState<string>("")
  const [imgLoading, setImgLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avoidProfileImageSync, setAvoidProfileImageSync] = useState(false)

  const supabase = createClient()
  const data = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (data?.error) {
          toast.error('Error fetching user data')
          setError(data.error)
          return
        }
        setIsLoading(true)
        setUser(data?.user)
        setProfile(data.profile)
      } catch (err: any) {
        toast.error(err.message || 'An unexpected error occurred');
        setError(err.message || 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [data])

  useEffect(() => {
    if (!profile) return
    setFormData({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      phone: profile.phone || "",
    })

    if (!avoidProfileImageSync && !file && !imgLoading) {
      setImageUrl(profile.image || "")
      setImagePath(profile.imagePath || "")
    }
  }, [profile])

  const uploadImage = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage
      .from('Profile')
      .upload(filePath, file)

    window.location.reload();
    if (error) {
      console.error("Supabase upload error:", error)
      throw new Error(error.message)
    }

    return data.path
  }
  const deleteImage = async (path: string): Promise<void> => {
    const { error } = await supabase.storage
      .from('Profile')
      .remove([path])
    window.location.reload();
    if (error) {
      console.error("Supabase delete error:", error)
      throw new Error(error.message)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const maxSize = 2 * 1024 * 1024 // 2MB
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

      if (!allowedTypes.includes(selectedFile.type)) {
        const msg = "Invalid file type. Use JPEG, PNG or WEBP."
        setImgError(msg)
        toast.error(msg)
        return
      }

      if (selectedFile.size > maxSize) {
        const msg = "File too large. Max size is 2MB."
        setImgError(msg)
        toast.error(msg)
        return
      }

      setFile(selectedFile)
      setImgError("")

      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
      setImageUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setImgError("Please select a file.")
      return
    }
    if (!user || !user.id) {
      setImgError("User not found. Please log in again.")
      return
    }

    setImgLoading(true)
    setAvoidProfileImageSync(true)
    const localPreviewUrl = imageUrl
    let uploadedPath: string | null = null

    try {
      if (imagePath) {
        try { await deleteImage(imagePath) } catch (delErr: any) { console.warn('Previous image delete failed', delErr) }
      }
      const newPath = await uploadImage(file, user.id)
      uploadedPath = newPath // Track uploaded path for potential cleanup

      const { data: publicUrlData } = supabase.storage
        .from('Profile')
        .getPublicUrl(newPath)

      if (!publicUrlData.publicUrl) {
        throw new Error("Could not get public URL for image.")
      }

      const newImageUrl = publicUrlData.publicUrl

      const { error: updateError } = await supabase.auth.updateUser({
        data: { image: newImageUrl, imagePath: newPath }
      })

      if (updateError) {
        throw updateError
      }

      setImageUrl(newImageUrl)
      setImagePath(newPath)
      setProfile((prev: any) => prev ? { ...prev, image: newImageUrl, imagePath: newPath } : prev)
      setFile(null)
      setImgError("")
      toast.success("Profile picture updated!")

      data.refreshProfile()
    } catch (err: any) {
      console.error("Upload failed:", err)
      setImgError(err.message || "Failed to upload image.")
      toast.error(err.message || "Failed to upload image.")
      setImageUrl(profile?.image || "")

      // Cleanup uploaded image if user update failed
      if (uploadedPath) {
        try {
          await deleteImage(uploadedPath)
          console.log("Cleaned up uploaded image due to API failure")
        } catch (deleteError) {
          console.error("Failed to cleanup uploaded image:", deleteError)
        }
      }
    } finally {
      setImgLoading(false)
      if (localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setTimeout(() => setAvoidProfileImageSync(false), 300)
    }
  }

  const handleCancelUpload = () => {
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
    setFile(null)
    setImgError("")
    setImageUrl(profile?.image || "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    if (!imagePath) return

    setImgLoading(true)
    setAvoidProfileImageSync(true)
    try {
      await deleteImage(imagePath)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { image: "", imagePath: "" }
      })

      if (updateError) {
        throw updateError
      }

      setImageUrl("")
      setImagePath("")
      setProfile((prev: any) => prev ? { ...prev, image: "", imagePath: "" } : prev)
      setFile(null)
      setImgError("")
      toast.success("Profile picture removed.")

      data.refreshProfile()

    } catch (err: any) {
      console.error("Delete failed:", err)
      setImgError("Failed to delete image.")
      toast.error("Failed to delete image.")
    }
    setImgLoading(false)
    setTimeout(() => setAvoidProfileImageSync(false), 300)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
        }
      })

      if (error) {
        toast.error("Failed to update profile")
        return
      }

      data.refreshProfile()
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      phone: profile?.phone || "",
    })
    setIsEditing(false)
  }

  // Address Management Logic
  const { data: addresses = [], isLoading: isLoadingAddresses } = useGetAddressesQuery(undefined, {
    skip: !user
  })
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation()
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation()
  const [setDefaultAddress, { isLoading: isSettingDefault }] = useSetDefaultAddressMutation()

  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)

  const defaultAddress = addresses.find(a => a.isDefault)
  const otherAddresses = addresses.filter(a => !a.isDefault)

  const handleAddAddress = async () => {
    try {
      await addAddress({ value: newAddress, isDefault: makeDefault }).unwrap()
      toast.success("Address added successfully")
      setNewAddress("")
      setMakeDefault(false)
      setIsAddingAddress(false)
    } catch (error) {
      toast.error("Failed to add address")
    }
  }

  const handleDeleteAddress = async (index: number) => {
    try {
      await deleteAddress(index).unwrap()
      toast.success("Address deleted")
    } catch (error) {
      toast.error("Failed to delete address")
    }
  }

  const handleSetDefault = async (index: number) => {
    try {
      await setDefaultAddress(index).unwrap()
      toast.success("Default address updated")
    } catch (error) {
      toast.error("Failed to set default address")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please login to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zayka-50 to-zayka-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">

              {/* --- NEW: Improved Image Upload UI --- */}
              <div className="mx-auto w-24 h-24 relative mb-4">
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="w-24 h-24 object-cover rounded-full" />
                ) : (
                  <div className="w-24 h-24 bg-zayka-100 dark:bg-zayka-900 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-zayka-600 dark:text-zayka-400" />
                  </div>
                )}

                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-1 -right-1 bg-zayka-600 text-white p-2 rounded-full cursor-pointer hover:bg-zayka-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={imgLoading}
                  />
                </label>
              </div>

              {/* Contextual Buttons for Image */}
              <div className="h-10">
                {file && (
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={imgLoading}
                      size="sm"
                    >
                      {imgLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Photo
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelUpload}
                      disabled={imgLoading}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {!file && imageUrl && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={imgLoading}
                    size="sm"
                  >
                    {imgLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Remove Photo
                  </Button>
                )}
              </div>

              {imgError && <p className="text-red-500 mt-2 text-sm">{imgError}</p>}

              <CardTitle className="text-2xl pt-4">My Profile</CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md min-h-[40px]">
                        {formData.firstName || "Not set"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md min-h-[40px]">
                        {formData.lastName || "Not set"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {user?.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md flex items-center gap-2 min-h-[40px]">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {formData.phone || "Not set"}
                    </div>
                  )}
                </div>
              </div>

              {/* Address Management Section - Only for customers */}
              {profile?.role === 'customer' && (
                <div className="pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Address Management</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingAddress(true)
                        setNewAddress("")
                        setMakeDefault(false)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </div>

                  {isAddingAddress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 space-y-3 bg-muted/50 p-4 rounded-lg"
                    >
                      <Label>New Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          className="pl-8"
                          placeholder="Enter full address"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="make-default" checked={makeDefault} onCheckedChange={setMakeDefault} />
                        <Label htmlFor="make-default">Set as default address</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAddingAddress(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAddAddress} disabled={!newAddress || isAdding}>
                          {isAdding ? "Adding..." : "Add Address"}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    {/* Default Address */}
                    {defaultAddress && (
                      <Card className="bg-zayka-50 dark:bg-zayka-900/20 border-zayka-200 dark:border-zayka-800">
                        <CardContent className="p-4 flex justify-between items-start">
                          <div className="flex gap-3">
                            <MapPin className="w-5 h-5 text-zayka-600 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Selected Address (Default)</span>
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{defaultAddress.value}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Other Addresses */}
                    <div className="space-y-3">
                      {otherAddresses.map((addr, index) => {
                        const realIndex = addresses.findIndex(a => a.id === addr.id)

                        return (
                          <div key={addr.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                            <div className="flex gap-3 items-start flex-1">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                              <p className="text-sm">{addr.value}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleSetDefault(realIndex)}
                                disabled={isSettingDefault}
                              >
                                Set Default
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteAddress(realIndex)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {!isLoadingAddresses && addresses.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No addresses saved yet.</p>
                    )}
                  </div>
                </div>
              )}


              <div className="flex gap-4 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="flex-1">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}