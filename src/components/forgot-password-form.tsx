"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError, setFormErrors } from "@/lib/form-error-handler"
import { useForgotPassword } from "@/hooks/mutations/use-auth-mutations"
import { authSchemas, type ForgotPasswordSchema } from "@/utils/validation-schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import React from "react"
import { useForm } from "react-hook-form"
import { FieldError, FormStateDisplay, useFormErrorState } from "./ui/form-error"

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(authSchemas.forgotPassword),
    defaultValues: {
      email: "",
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

  const forgotPasswordMutation = useForgotPassword()

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      clearFormErrors()
    }
  }, [errors, clearFormErrors])

  const handleFormErrors = React.useCallback(
    (error: FormError) => {
      if (Object.keys(error.fieldErrors).length > 0) {
        setFormErrors<ForgotPasswordSchema>(setError, error.fieldErrors)
        setMultipleFieldErrors(error.fieldErrors)
      } else {
        setGeneralError(error.message)
      }
    },
    [setError, setMultipleFieldErrors, setGeneralError]
  )

  const onSubmit = async (data: ForgotPasswordSchema) => {
    clearFormErrors()
    clearErrors()

    forgotPasswordMutation.mutate(data, {
      onSuccess: (response) => {
        reset()
        clearFormErrors()
        onSuccess?.(response.email)
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

  const isFormLoading = isSubmitting || forgotPasswordMutation.isPending

  return (
    <FormStateDisplay
      error={generalError}
      fieldErrors={fieldErrors}
      onErrorDismiss={clearGeneralError}
      className="space-y-4"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email address"
            disabled={isFormLoading}
            aria-invalid={!!(errors.email || fieldErrors.email)}
            className={errors.email || fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.email?.message || fieldErrors.email} />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isFormLoading || hasErrors}>
            {isFormLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send reset code
          </Button>
        </div>
      </form>
    </FormStateDisplay>
  )
}
