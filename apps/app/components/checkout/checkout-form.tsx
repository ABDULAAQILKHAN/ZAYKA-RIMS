"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useForm } from "react-hook-form"
import { useAppSelector } from "@/store/hooks"
import { useCreateOrderMutation } from "@/store/ordersApi"
import { useGetCartQuery, useClearCartMutation, CartItem } from "@/store/cartApi"
import { useGetAddressesQuery } from "@/store/addressApi"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  instructions: string
}

export default function CheckoutForm() {
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const router = useRouter()
  const { profile, isLoading: isProfileLoading } = useAuth()
  const token = useAppSelector((state) => state.auth.token)
  
  // Fetch cart data
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, { skip: !token })
  const items: CartItem[] = Array.isArray(cartData) ? cartData : []
  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)

  // Fetch addresses
  const { data: addresses = [], isLoading: isAddressLoading } = useGetAddressesQuery(undefined, { skip: !token })

  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation()
  const [clearCart] = useClearCartMutation()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CheckoutFormData>()

  // Prefill contact information from profile
  useEffect(() => {
    if (profile) {
      setValue("firstName", profile.first_name || "")
      setValue("lastName", profile.last_name || "")
      setValue("email", profile.email || "")
      setValue("phone", profile.phone || "")
    }
  }, [profile, setValue])

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      } else {
        setSelectedAddressId(addresses[0].id)
      }
    }
  }, [addresses, selectedAddressId])

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    
    setIsApplyingCoupon(true)
    // Simulate coupon validation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsApplyingCoupon(false)
    toast.success("Coupon applied!")
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    if (!selectedAddressId) {
      toast.error("Please select a delivery address")
      return
    }

    try {
      await createOrder({
        addressId: selectedAddressId,
        deliveryInstructions: data.instructions || undefined
      }).unwrap()

      await clearCart().unwrap()
      toast.success("Order placed successfully!")
      router.push("/orders")
    } catch (error: any) {
      console.error("Failed to place order:", error)
      toast.error(error?.data?.message || "Failed to place order. Please try again.")
    }
  }

  const isLoading = isProfileLoading || isCartLoading || isAddressLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zayka-600"></div>
      </div>
    )
  }

  return (
    <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact Information */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  {...register("firstName", { required: "First name is required" })} 
                  placeholder="John"
                  disabled
                  className="bg-muted"
                />
                {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  {...register("lastName", { required: "Last name is required" })} 
                  placeholder="Doe"
                  disabled
                  className="bg-muted"
                />
                {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email", { required: "Email is required" })} 
                placeholder="john@example.com"
                disabled
                className="bg-muted"
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                {...register("phone", { required: "Phone is required" })} 
                placeholder="+91 98765 43210"
                disabled
                className="bg-muted"
              />
              {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              Contact info is from your profile. <Link href="/profile" className="text-zayka-600 hover:underline">Update in profile</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delivery Address Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No saved addresses found</p>
                <Button asChild variant="outline">
                  <Link href="/profile">Add Address in Profile</Link>
                </Button>
              </div>
            ) : (
              <>
                <RadioGroup 
                  value={selectedAddressId} 
                  onValueChange={setSelectedAddressId}
                  className="space-y-3"
                >
                  {addresses.map((address) => (
                    <div 
                      key={address.id} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddressId === address.id 
                          ? 'border-zayka-600 bg-zayka-50 dark:bg-zayka-950' 
                          : 'border-border hover:border-zayka-300'
                      }`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={address.id} className="cursor-pointer">
                          <span className="block text-sm">{address.value}</span>
                          {address.isDefault && (
                            <span className="text-xs text-zayka-600 font-medium mt-1 inline-block">Default Address</span>
                          )}
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  <Link href="/profile" className="text-zayka-600 hover:underline">Manage addresses in profile</Link>
                </p>
              </>
            )}

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
              <Textarea 
                id="instructions" 
                {...register("instructions")} 
                placeholder="Leave at door, ring bell, landmark nearby, etc." 
                rows={3} 
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coupon Code - Commented for now */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Coupon Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button 
                variant="outline" 
                onClick={handleApplyCoupon} 
                disabled={!couponCode.trim() || isApplyingCoupon}
              >
                {isApplyingCoupon ? "Applying..." : "Apply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div> */}

      {/* Payment Method - Commented for now */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card">Credit/Debit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal">PayPal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Cash on Delivery</Label>
              </div>
            </RadioGroup>

            {paymentMethod === "card" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div> */}

      {/* Submit Button for Mobile */}
      <div className="lg:hidden">
        <Button 
          type="submit" 
          className={`w-full ${(isCreating || items.length === 0 || !selectedAddressId) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isCreating || items.length === 0 || !selectedAddressId}
        >
          {isCreating ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </form>
  )
}
