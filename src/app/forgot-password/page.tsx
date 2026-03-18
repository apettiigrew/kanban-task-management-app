"use client"

import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()

  const handleSuccess = (email: string) => {
    router.push(`/reset-password?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="text-muted-foreground">
            Enter your email and we&apos;ll send you a reset code
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <ForgotPasswordForm onSuccess={handleSuccess} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <a
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
