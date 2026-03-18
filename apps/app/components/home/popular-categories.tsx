"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { useGetActiveMenuCategoriesQuery, useGetMenuItemsQuery } from "@/store/menuApi"

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

export default function PopularCategories() {
  const { data: categories = [], isLoading } = useGetActiveMenuCategoriesQuery()
  const { data: allMenuItems = [] } = useGetMenuItemsQuery({})
  
  // Count items per category
  const categoriesWithCount = categories.map(category => ({
    ...category,
    count: allMenuItems.filter(item => item.categoryId === category.id).length
  }))
  
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Browse by Category</h2>
          <p className="text-muted-foreground mt-2">Explore our wide range of delicious options</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Browse by Category</h2>
        <p className="text-muted-foreground mt-2">Explore our wide range of delicious options</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6"
      >
        {categoriesWithCount.slice(0, 6).map((category) => (
          <motion.div key={category.id} variants={item}>
            <Link href={`/menu?category=${category.id}`}>
              <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md hover:scale-105">
                <div className="relative h-32 sm:h-40">
                  <Image src={category.image || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{category.count} items</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
