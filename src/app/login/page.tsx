"use client"

import { LoginForm } from "@/components/login-form"
import Link from "next/link"
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
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Go to register page"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  window.location.href = "/register"
                }
              }}
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
