import type { Metadata } from "next"
import AdminDashboard from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard - Zayka Restaurant",
  description: "Manage your restaurant menu and orders",
}

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <AdminDashboard />
    </div>
  )
}
