import ManagerOrderManagement from "@/components/manager/manager-order-management"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Manager Orders - Zayka",
    description: "Manage restaurant orders",
}

export default function ManagerOrdersPage() {
    return (
        <div className="container mx-auto py-6">
            <ManagerOrderManagement />
        </div>
    )
}
