import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@zayka/ui"
import CategoryManagement from "@/components/admin/category-management"

export const metadata: Metadata = {
    title: "Category Management - Zayka Admin",
    description: "Add, edit, and manage menu categories",
}

export default function AdminCategoriesPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="mb-6">
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
                    <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            <CategoryManagement />
        </div>
    )
}
