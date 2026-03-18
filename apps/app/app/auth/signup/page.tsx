import type { Metadata } from "next"
import SignupForm from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign Up - Zayka Restaurant",
  description: "Create a new Zayka account",
}

export default function SignupPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:px-6">
      <div className="max-w-md mx-auto">
        <SignupForm />
      </div>
    </div>
  )
}
