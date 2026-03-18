import type React from "react"
import { Inter as FontSans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { StoreProvider } from "@/components/providers/store-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import { Toaster } from "react-hot-toast"
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "Zayka - Delicious Food Delivered",
  description: "Order delicious food from Zayka darbar",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Toaster position="bottom-center" />
          <StoreProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </AuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
