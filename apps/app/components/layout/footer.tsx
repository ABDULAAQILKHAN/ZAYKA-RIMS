import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-muted py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-zayka-600 dark:text-zayka-400">Zayka</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Delicious food delivered to your doorstep. Experience the authentic taste of India with our carefully
              crafted dishes.
            </p>
            <div className="mt-6 flex space-x-4">
              {/* <Link href="#" className="text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link> */}
              <Link href="https://www.instagram.com/zayka__darbar/" className="text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              {/* <Link href="#" className="text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link> */}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className="text-sm text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400"
                >
                  Menu
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400"
                >
                  About Us
                </Link>
              </li> */}
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-zayka-600 dark:hover:text-zayka-400"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Monday - Friday</span>
                <span>11:00 AM - 11:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday</span>
                <span>11:00 AM - 12:00 AM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span>11:00 AM - 12:00 AM</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Contact Us</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              <p>zayka darbar - choupal sagar/ agar road / ujjain</p>
              <p>Phone: (+91) 70009 69701</p>
              <p>Email: info@zayka.com</p>
            </address>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Zayka Restaurant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
