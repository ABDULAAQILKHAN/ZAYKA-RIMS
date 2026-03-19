import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cn } from "@zayka/utils"
import { Sidebar } from "@/components/sidebar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Zayka RIMS - Restaurant Inventory Management",
  description: "Restaurant Inventory Management System for Zayka Darbar",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
