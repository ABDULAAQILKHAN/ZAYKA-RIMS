"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    id: 1,
    name: "Aaqil Khan",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    text: "The food at Zayka is absolutely amazing! The flavors are authentic and the service is excellent. I highly recommend the Butter Chicken.",
  },
  {
    id: 2,
    name: "Affan khan",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 4,
    text: "Great ambiance and delicious food. The Paneer Tikka Masala is to die for! Will definitely be coming back.",
  },
  {
    id: 3,
    name: "Zoya khan",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 5,
    text: "Best Indian restaurant in town! The Chicken Biryani is perfectly spiced and the naan bread is so soft and fluffy.",
  },
  {
    id: 4,
    name: "Hina afreen khan",
    avatar: "/placeholder.svg?height=100&width=100",
    rating: 4,
    text: "Excellent food and prompt delivery. The online ordering system is very convenient and user-friendly.",
  },
]

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">What Our Customers Say</h2>
          <p className="text-muted-foreground mt-2">Don't just take our word for it</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative h-[300px] sm:h-[250px]">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="absolute w-full"
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: index === activeIndex ? 1 : 0,
                  x: index === activeIndex ? 0 : 100,
                  zIndex: index === activeIndex ? 10 : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                      <div className="flex-shrink-0">
                        <div className="relative h-20 w-20 rounded-full overflow-hidden">
                          <Image
                            src={testimonial.avatar || "/placeholder.svg"}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex justify-center sm:justify-start mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mb-4 italic">{testimonial.text}</p>
                        <p className="font-medium">{testimonial.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-zayka-600" : "bg-gray-300"}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
