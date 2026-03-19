"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@zayka/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zayka/ui"
import { Badge } from "@zayka/ui"
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zayka/ui"
import {
  useGetSpecialOffersQuery,
  useGetTodaysSpecialsQuery,
  useDeleteSpecialOfferMutation,
  useDeleteTodaysSpecialMutation,
  useUpdateSpecialOfferMutation,
  useUpdateTodaysSpecialMutation
} from "@/store/offersApi"
import { SpecialOfferForm } from "@/components/admin/special-offer-form"
import { TodaysSpecialForm } from "@/components/admin/todays-special-form"
import Image from "next/image"
import toast from "react-hot-toast"
import { deleteImage, getImagePathFromUrl } from "@zayka/auth/storage"

export default function OffersPage() {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [selectedSpecialId, setSelectedSpecialId] = useState<string | null>(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [showSpecialForm, setShowSpecialForm] = useState(false)

  const { data: specialOffers = [], isLoading: offersLoading, error: offersError } = useGetSpecialOffersQuery()
  const { data: todaysSpecials = [], isLoading: specialsLoading, error: specialsError } = useGetTodaysSpecialsQuery()


  const [deleteOffer] = useDeleteSpecialOfferMutation()
  const [deleteSpecial] = useDeleteTodaysSpecialMutation()
  const [updateOffer] = useUpdateSpecialOfferMutation()
  const [updateSpecial] = useUpdateTodaysSpecialMutation()

  const handleDeleteOffer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this special offer?')) {
      try {
        // Find the offer to get its image URL before deletion
        const offerToDelete = specialOffers.find(offer => offer.id === id)
        
        // Delete the offer from database first
        await deleteOffer(id).unwrap()
        
        // If the offer had an image, try to delete it from storage
        if (offerToDelete?.image) {
          try {
            const imagePath = getImagePathFromUrl(offerToDelete.image)
            if (imagePath) {
              await deleteImage(imagePath)
            }
          } catch (imageError) {
            console.log('Failed to delete image from storage:', imageError)
            // Don't fail the entire operation if image deletion fails
          }
        }
        
        toast.success('Special offer deleted successfully')
      } catch (error) {
        toast.error('Failed to delete special offer')
      }
    }
  }

  const handleDeleteSpecial = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this special item?')) {
      try {
        // Find the special to get its image URL before deletion
        const specialToDelete = todaysSpecials.find(special => special.id === id)
        
        // Delete the special from database first
        await deleteSpecial(id).unwrap()
        
        // If the special had an image, try to delete it from storage
        if (specialToDelete?.image) {
          try {
            const imagePath = getImagePathFromUrl(specialToDelete.image)
            if (imagePath) {
              await deleteImage(imagePath)
            }
          } catch (imageError) {
            console.log('Failed to delete image from storage:', imageError)
            // Don't fail the entire operation if image deletion fails
          }
        }
        
        toast.success('Special item deleted successfully')
      } catch (error) {
        toast.error('Failed to delete special item')
      }
    }
  }

  const handleToggleOfferStatus = async (offer: any) => {
    try {
      await updateOffer({ id: offer.id, isActive: !offer.isActive }).unwrap()
      toast.success(`Offer ${!offer.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('Failed to update offer status')
    }
  }

  const handleToggleSpecialStatus = async (special: any) => {
    try {
      await updateSpecial({ id: special.id, isActive: !special.isActive }).unwrap()
      toast.success(`Special ${!special.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('Failed to update special status')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
          <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Offers & Specials Management</h1>
        <p className="text-muted-foreground mt-2">Manage special offers and today's special items</p>
      </div>

      <Tabs defaultValue="offers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="offers">Special Offers</TabsTrigger>
          <TabsTrigger value="specials">Today's Specials</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Special Offers</h2>
            <Button onClick={() => setShowOfferForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Special Offer
            </Button>
          </div>

          {offersLoading ? (
            <div>Loading offers...</div>
          ) : offersError ? (
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Offers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {JSON.stringify(offersError)}
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : specialOffers.length === 0 ? (
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">No Special Offers Found</h3>
              <p className="text-muted-foreground mb-4">Create your first special offer to get started.</p>
              <Button onClick={() => setShowOfferForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Offer
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {specialOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={offer.image || "/placeholder.svg"}
                      alt={offer.title}
                      fill
                      className="object-cover"
                    />
                    <Badge
                      className="absolute top-2 right-2"
                      variant={offer.isActive ? "default" : "secondary"}
                    >
                      {offer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <CardDescription>{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleOfferStatus(offer)}
                      >
                        {offer.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {offer.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOfferId(offer.id)
                            setShowOfferForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="specials" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Today's Specials</h2>
            <Button onClick={() => setShowSpecialForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Special Item
            </Button>
          </div>

          {specialsLoading ? (
            <div>Loading specials...</div>
          ) : specialsError ? (
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Specials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {JSON.stringify(specialsError)}
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : todaysSpecials.length === 0 ? (
            <div className="text-center p-8">
              <h3 className="text-lg font-semibold mb-2">No Today's Specials Found</h3>
              <p className="text-muted-foreground mb-4">Create your first special item to get started.</p>
              <Button onClick={() => setShowSpecialForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Special
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {todaysSpecials.length > 0 && todaysSpecials.map((special) => (
                <Card key={special.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={special.image || "/placeholder.svg"}
                      alt={special.name}
                      fill
                      className="object-cover"
                    />
                    <Badge
                      className="absolute top-2 left-2"
                      variant={special.isVeg ? "secondary" : "destructive"}
                    >
                      {special.isVeg ? "Veg" : "Non-Veg"}
                    </Badge>
                    <Badge
                      className="absolute top-2 right-2"
                      variant={special.isActive ? "default" : "secondary"}
                    >
                      {special.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{special.name}</CardTitle>
                      <span className="font-semibold">${+special?.price}</span>
                    </div>
                    <CardDescription>{special.description}</CardDescription>
                    <Badge variant="outline">{special.category}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSpecialStatus(special)}
                      >
                        {special.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {special.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSpecialId(special.id)
                            setShowSpecialForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSpecial(special.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showOfferForm && (
        <SpecialOfferForm
          offerId={selectedOfferId}
          onClose={() => {
            setShowOfferForm(false)
            setSelectedOfferId(null)
          }}
        />
      )}

      {showSpecialForm && (
        <TodaysSpecialForm
          specialId={selectedSpecialId}
          onClose={() => {
            setShowSpecialForm(false)
            setSelectedSpecialId(null)
          }}
        />
      )}
    </div>
  )
}
