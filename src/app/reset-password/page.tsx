import { ResetPasswordForm } from "@/components/reset-password-form"

interface ResetPasswordPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { email = "" } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground">
            {email
              ? `Enter the code sent to ${email} and choose a new password`
              : "Enter the reset code from your email and choose a new password"}
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <ResetPasswordForm email={email} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <a
            href="/forgot-password"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Request a new one
          </a>
        </p>
      </div>
    </div>
  )
}
