import type { Metadata } from "next"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login - Zayka Restaurant",
  description: "Login to your Zayka account",
}

export default function LoginPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:px-6">
      <div className="max-w-md mx-auto">
        <LoginForm />
      </div>
    </div>
  )
}
