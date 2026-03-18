import type { Metadata } from "next"
import ResetPasswordForm from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset Password - Zayka Restaurant",
  description: "Set your new password for Zayka account",
}

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:px-6">
      <div className="max-w-md mx-auto">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
