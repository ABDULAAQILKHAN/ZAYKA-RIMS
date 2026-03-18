"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { MenuCategory } from "@/store/menuApi"

interface MenuCategoriesProps {
  categories: MenuCategory[]
}

export default function MenuCategories({ categories }: MenuCategoriesProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category") || "all"

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams)
    if (categoryId === "all") {
      params.delete("category")
    } else {
      params.set("category", categoryId)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="bg-muted/40 p-4 rounded-lg">
      <h2 className="font-medium mb-4">Categories</h2>
      <div className="space-y-1">
        <CategoryButton isActive={currentCategory === "all"} onClick={() => handleCategoryChange("all")}>
          All Items
        </CategoryButton>

        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            isActive={currentCategory === category.id}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </CategoryButton>
        ))}
      </div>
    </div>
  )
}

interface CategoryButtonProps {
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
}

function CategoryButton({ children, isActive, onClick }: CategoryButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn("w-full justify-start relative", isActive && "font-medium")}
      onClick={onClick}
    >
      <div className="flex w-full items-center">{children}</div>
      {isActive && (
        <motion.div
          layoutId="activeCategory"
          className="absolute left-0 top-0 h-full w-1 bg-zayka-600 dark:bg-zayka-400 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </Button>
  )
}
