"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/store/hooks"
import { useAddToCartMutation } from "@/store/cartApi"
import { useGetActiveTodaysSpecialsQuery } from "@/store/offersApi"
import { toast } from "sonner"

// Fallback data in case API fails
const fallbackSpecialItems = [
  {
    id: "special1",
    name: "Butter Chicken",
    description: "Tender chicken in a rich, creamy tomato sauce",
    price: 14.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "Main Course",
    isVeg: false,
    isActive: true,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "special2",
    name: "Paneer Tikka Masala",
    description: "Grilled cottage cheese in a spiced tomato gravy",
    price: 12.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "Main Course",
    isVeg: true,
    isActive: true,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "special3",
    name: "Chicken Biryani",
    description: "Fragrant rice dish with chicken and aromatic spices",
    price: 15.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "Rice",
    isVeg: false,
    isActive: true,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "special4",
    name: "Garlic Naan",
    description: "Soft bread with garlic and butter",
    price: 3.99,
    image: "/placeholder.svg?height=300&width=300",
    category: "Bread",
    isVeg: true,
    isActive: true,
    createdAt: "",
    updatedAt: ""
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function TodaysSpecial() {
  const router = useRouter()
  const token = useAppSelector((state) => state.auth.token)
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation()
  const { data: apiSpecials, isLoading, error } = useGetActiveTodaysSpecialsQuery()

  const handleAddToCart = async (specialItem: any) => {
    if (!token) {
      toast.error("Please login to add items to cart")
      router.push("/auth/login?redirect=/")
      return
    }

    try {
      await addToCart({
        menuItemId: specialItem.id,
        quantity: 1,
        size: "Full"
      }).unwrap()
      toast.success("Added to cart")
    } catch (error) {
      toast.error("Failed to add item to cart")
    }
  }

  // Debug logging
  // console.log('TodaysSpecial Debug:', {
  //   apiSpecials,
  //   isLoading,
  //   error,
  //   apiSpecialsLength: apiSpecials?.length,
  //   fallbackSpecialsLength: fallbackSpecialItems.length,
  //   apiSpecialsType: typeof apiSpecials,
  //   isArray: Array.isArray(apiSpecials)
  // })

  // Use API data if available (even if empty array), otherwise fallback to static data
  const specialItems = Array.isArray(apiSpecials) ? apiSpecials : fallbackSpecialItems
  const showFallback = !Array.isArray(apiSpecials) || apiSpecials.length === 0

  // Show error state
  if (error) {
    console.error('Today\'s Specials API Error:', error)
    return (
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-red-600">API Error</h2>
          <p className="text-muted-foreground mt-2">
            Error loading specials: {JSON.stringify(error)}
          </p>
          <p className="text-sm mt-2">Using fallback data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {fallbackSpecialItems.map((item) => (
            <Card key={item.id} className="overflow-hidden h-full">
              <div className="relative h-48">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Today's Special</h2>
            <p className="text-muted-foreground mt-2">Loading chef's recommendations...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <Card className="overflow-hidden h-full">
                <div className="relative h-48 bg-gray-200" />
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded" />
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Today's Special</h2>
          <p className="text-muted-foreground mt-2">
            {showFallback ? "Chef's recommendations for the day" :
              Array.isArray(apiSpecials) && apiSpecials.length === 0 ? "No specials available today" :
                "Chef's recommendations for the day"}
          </p>
          {showFallback && (
            <p className="text-xs text-muted-foreground mt-1">
              {Array.isArray(apiSpecials) && apiSpecials.length === 0 ? "(Showing sample items)" : "(Using fallback data)"}
            </p>
          )}
        </div>
        <Button variant="link" asChild className="hidden md:flex items-center gap-2 mt-4 md:mt-0">
          <Link href="/menu">
            View full menu
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {specialItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No special items available at the moment.</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {specialItems.map((specialItem) => (
            <motion.div key={specialItem.id} variants={item}>
              <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
                <div className="relative h-48">
                  <Image src={specialItem.image || "/placeholder.svg"} alt={specialItem.name} fill className="object-cover" />
                  <Badge className="absolute top-2 right-2" variant={specialItem.isVeg ? "secondary" : "default"}>
                    {specialItem.isVeg ? "Veg" : "Non-Veg"}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{specialItem.name}</h3>
                    <span className="font-medium text-zayka-600 dark:text-zayka-400">₹{specialItem.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{specialItem.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {specialItem.category}
                  </Badge>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    className="w-full"
                    disabled={isAddingToCart}
                    onClick={() => handleAddToCart(specialItem)}
                  >
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="flex justify-center mt-8 md:hidden">
        <Button variant="link" asChild className="flex items-center gap-2">
          <Link href="/menu">
            View full menu
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
