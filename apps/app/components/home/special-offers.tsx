"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGetActiveSpecialOffersQuery } from "@/store/offersApi"

// Fallback data in case API fails
const fallbackOffers = [
  {
    id: "1",
    title: "30% OFF on First Order",
    description: "Use code WELCOME30 at checkout",
    image: "/offer.png?height=300&width=300",
    link: "/menu",
    isActive: true,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "2", 
    title: "Family Combo Deal",
    description: "4 main courses, 2 sides, and drinks at 20% off",
    image: "/family combo.png?height=300&width=300",
    link: "/menu",
    isActive: true,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "3",
    title: "Free Delivery", 
    description: "On orders above $30",
    image: "/free delivery.png?height=300&width=300",
    link: "/menu",
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

export default function SpecialOffers() {
  const { data: apiOffers, isLoading, error } = useGetActiveSpecialOffersQuery()
  
  // Debug logging
  // console.log('SpecialOffers Debug:', {
  //   apiOffers,
  //   isLoading,
  //   error,
  //   apiOffersLength: apiOffers?.length,
  //   fallbackOffersLength: fallbackOffers.length,
  //   apiOffersType: typeof apiOffers,
  //   isArray: Array.isArray(apiOffers)
  // })

  const offers = Array.isArray(apiOffers) ? apiOffers : fallbackOffers
  const showFallback = !Array.isArray(apiOffers) || apiOffers.length === 0

  // Show error state
  if (error) {
    console.error('Special Offers API Error:', error)
    return (
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-red-600">API Error</h2>
          <p className="text-muted-foreground mt-2">
            Error loading offers: {JSON.stringify(error)}
          </p>
          <p className="text-sm mt-2">Using fallback data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {fallbackOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden h-full">
              <div className="relative h-[400px]">
                <Image src={offer.image || "/placeholder.svg"} alt={offer.title} fill className="object-fill" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                <p className="text-muted-foreground">{offer.description}</p>
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
            <h2 className="text-3xl font-bold tracking-tight">Special Offers</h2>
            <p className="text-muted-foreground mt-2">Loading exclusive deals...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <Card className="overflow-hidden h-full">
                <div className="relative h-[400px] bg-gray-200" />
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded" />
                </CardContent>
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
          <h2 className="text-3xl font-bold tracking-tight">Special Offers</h2>
          <p className="text-muted-foreground mt-2">
            {showFallback ? "Exclusive deals you don't want to miss" : 
             Array.isArray(apiOffers) && apiOffers.length === 0 ? "No active offers at the moment" :
             "Exclusive deals you don't want to miss"}
          </p>
          {showFallback && (
            <p className="text-xs text-muted-foreground mt-1">
              {Array.isArray(apiOffers) && apiOffers.length === 0 ? "(Showing sample offers)" : "(Using fallback data)"}
            </p>
          )}
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No special offers available at the moment.</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {offers.map((offer) => (
            <motion.div key={offer.id} variants={item}>
              <Link href={offer.link || "/menu"}>
                <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
                  <div className="relative h-[400px]">
                    <Image src={offer.image || "/placeholder.svg"} alt={offer.title} fill className="object-fill" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                    <p className="text-muted-foreground">{offer.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="flex justify-center mt-8 md:hidden">
        <Button variant="link" asChild className="flex items-center gap-2">
          <Link href="/menu">
            View all offers
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
