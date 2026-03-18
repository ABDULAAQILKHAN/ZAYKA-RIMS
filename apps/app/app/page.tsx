import type { Metadata } from "next"
import Hero from "@/components/home/hero"
import SpecialOffers from "@/components/home/special-offers"
import TodaysSpecial from "@/components/home/todays-special"
import PopularCategories from "@/components/home/popular-categories"
import Testimonials from "@/components/home/testimonials"

export const metadata: Metadata = {
  title: "Zayka darbar - Delicious Food Delivered",
  description: "Order delicious food from Zayka restaurant",
  icons: {
    icon: '/icon.jpeg',
  },
}

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      <Hero />
      <SpecialOffers />
      <TodaysSpecial />
      <PopularCategories />
      <Testimonials />
    </div>
  )
}
