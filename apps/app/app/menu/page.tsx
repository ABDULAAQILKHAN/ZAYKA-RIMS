"use client"

import { Suspense } from "react"
import MenuHeader from "@/components/menu/menu-header"
import MenuCategories from "@/components/menu/menu-categories"
import MenuList from "./menu-list"
import { useGetActiveMenuCategoriesQuery } from "@/store/menuApi"

function MenuSkeleton() {
  return <div className="flex items-center justify-center py-8">Loading menu...</div>
}

export default function MenuPage() {
  const { data: categories = [], isLoading } = useGetActiveMenuCategoriesQuery()

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <MenuHeader />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <MenuHeader />
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 mt-8">
        <MenuCategories categories={categories} />
        <Suspense fallback={<MenuSkeleton />}>
          <MenuList />
        </Suspense>
      </div>
    </div>
  )
}
