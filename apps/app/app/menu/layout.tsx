import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menu - Zayka Restaurant",
  description: "Explore our delicious menu options",
}

// Force dynamic rendering to prevent build-time errors with useSearchParams
export const dynamic = 'force-dynamic'

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
