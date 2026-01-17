"use client"

import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Enter your credentials to login
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <LoginForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}
