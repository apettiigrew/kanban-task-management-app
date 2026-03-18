"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError, setFormErrors } from "@/lib/form-error-handler"
import { useResetPassword } from "@/hooks/mutations/use-auth-mutations"
import { authSchemas, type ResetPasswordSchema } from "@/utils/validation-schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import { useForm } from "react-hook-form"
import { FieldError, FormStateDisplay, useFormErrorState } from "./ui/form-error"

interface ResetPasswordFormProps {
  email: string
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(authSchemas.resetPassword),
    defaultValues: {
      email,
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const {
    generalError,
    fieldErrors,
    setError: setGeneralError,
    setMultipleFieldErrors,
    clearErrors: clearFormErrors,
    clearGeneralError,
    hasErrors,
  } = useFormErrorState()

  const resetPasswordMutation = useResetPassword()

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      clearFormErrors()
    }
  }, [errors, clearFormErrors])

  const handleFormErrors = React.useCallback(
    (error: FormError) => {
      if (Object.keys(error.fieldErrors).length > 0) {
        setFormErrors<ResetPasswordSchema>(setError, error.fieldErrors)
        setMultipleFieldErrors(error.fieldErrors)
      } else {
        setGeneralError(error.message)
      }
    },
    [setError, setMultipleFieldErrors, setGeneralError]
  )

  const onSubmit = async (data: ResetPasswordSchema) => {
    clearFormErrors()
    clearErrors()

    const { confirmPassword: _, ...requestData } = data

    resetPasswordMutation.mutate(requestData, {
      onSuccess: () => {
        reset()
        clearFormErrors()
        router.push('/login')
      },
      onError: (error) => {
        if (error instanceof FormError) {
          handleFormErrors(error)
        } else {
          setGeneralError('An unexpected error occurred. Please try again.')
        }
      },
    })
  }

  const isFormLoading = isSubmitting || resetPasswordMutation.isPending

  return (
    <FormStateDisplay
      error={generalError}
      fieldErrors={fieldErrors}
      onErrorDismiss={clearGeneralError}
      className="space-y-4"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("email")} />

        <div className="space-y-2">
          <Label htmlFor="code">Reset code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            {...register("code")}
            placeholder="Enter the 6-digit code"
            disabled={isFormLoading}
            aria-invalid={!!(errors.code || fieldErrors.code)}
            className={errors.code || fieldErrors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.code?.message || fieldErrors.code} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            placeholder="Enter your new password"
            disabled={isFormLoading}
            aria-invalid={!!(errors.newPassword || fieldErrors.newPassword)}
            className={errors.newPassword || fieldErrors.newPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.newPassword?.message || fieldErrors.newPassword} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="Confirm your new password"
            disabled={isFormLoading}
            aria-invalid={!!(errors.confirmPassword || fieldErrors.confirmPassword)}
            className={errors.confirmPassword || fieldErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.confirmPassword?.message || fieldErrors.confirmPassword} />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isFormLoading || hasErrors}>
            {isFormLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reset password
          </Button>
        </div>
      </form>
    </FormStateDisplay>
  )
}
