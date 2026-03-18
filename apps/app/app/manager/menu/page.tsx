import ManagerMenuManagement from "@/components/manager/manager-menu-management"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Manager Menu - Zayka",
    description: "Manage menu visibility",
}

export default function ManagerMenuPage() {
    return (
        <div className="container mx-auto py-6">
            <ManagerMenuManagement />
        </div>
    )
}
