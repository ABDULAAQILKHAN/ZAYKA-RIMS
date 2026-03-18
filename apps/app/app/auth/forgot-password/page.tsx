import type { Metadata } from "next"
import ForgotPasswordForm from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password - Zayka Restaurant",
  description: "Reset your Zayka account password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:px-6">
      <div className="max-w-md mx-auto">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
