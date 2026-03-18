import { VerifyEmailForm } from "@/components/verify-email-form"

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email = "" } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            {email
              ? `We sent a verification code to ${email}`
              : "Enter the verification code we sent to your email"}
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <VerifyEmailForm email={email} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
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
