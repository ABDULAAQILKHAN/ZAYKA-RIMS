import RiderDeliveryManagement from "@/components/rider/rider-delivery-management"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Rider Dashboard - Zayka",
    description: "Manage your deliveries",
}

export default function RiderPage() {
    return <RiderDeliveryManagement />
}
