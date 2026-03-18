"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="heroBackground.jpg?height=800&width=1600"
          alt="Hero background"
          fill
          className="object-cover brightness-[0.4]"
          priority
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-24 md:py-32 lg:py-40 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[200px] items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              Delicious Food for Every Mood
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg">
              Experience the authentic taste of India with our carefully crafted dishes made from the finest
              ingredients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" asChild>
                <Link href="/menu">Explore Menu</Link>
              </Button>
              {/* <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                <Link href="/reservation">Book a Table</Link>
              </Button> */}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="relative h-[400px] w-[400px]">
              <Image src="https://www.licious.in/blog/wp-content/uploads/2022/06/chicken-hyderabadi-biryani-01.jpg?height=400&width=400" alt="Featured dish" fill className="object-contain rounded-xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
