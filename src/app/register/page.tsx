"use client"

import { RegisterForm } from "@/components/register-form"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  const handleSuccess = (email: string) => {
    router.push(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground">
            Enter your details to register
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <RegisterForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}
