"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError, setFormErrors } from "@/lib/form-error-handler"
import { useLoginUser } from "@/hooks/mutations/use-auth-mutations"
import { authSchemas, type LoginSchema } from "@/utils/validation-schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import React from "react"
import { useForm } from "react-hook-form"
import { FieldError, FormStateDisplay, useFormErrorState } from "./ui/form-error"

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm<LoginSchema>({
    resolver: zodResolver(authSchemas.signIn),
    defaultValues: {
      email: "",
      password: "",
    }
  })

  const {
    generalError,
    fieldErrors,
    setError: setGeneralError,
    setMultipleFieldErrors,
    clearErrors: clearFormErrors,
    clearGeneralError,
    hasErrors
  } = useFormErrorState()

  const loginUserMutation = useLoginUser()

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      clearFormErrors()
    }
  }, [errors, clearFormErrors])

  const handleFormErrors = React.useCallback((error: FormError) => {
    if (Object.keys(error.fieldErrors).length > 0) {
      setFormErrors<LoginSchema>(setError, error.fieldErrors)
      setMultipleFieldErrors(error.fieldErrors)
    } else {
      setGeneralError(error.message)
    }
  }, [setError, setMultipleFieldErrors, setGeneralError])

  const onSubmit = async (data: LoginSchema) => {
    clearFormErrors()
    clearErrors()

    loginUserMutation.mutate(data, {
      onSuccess: () => {
        reset()
        clearFormErrors()
        onSuccess?.()
      },
      onError: (error) => {
        if (error instanceof FormError) {
          handleFormErrors(error)
        } else {
          setGeneralError('An unexpected error occurred. Please try again.')
        }
      }
    })
  }

  const isFormLoading = isSubmitting || loginUserMutation.isPending

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
            placeholder="Enter your email"
            disabled={isFormLoading}
            aria-invalid={!!(errors.email || fieldErrors.email)}
            className={errors.email || fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.email?.message || fieldErrors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="Enter your password"
            disabled={isFormLoading}
            aria-invalid={!!(errors.password || fieldErrors.password)}
            className={errors.password || fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.password?.message || fieldErrors.password} />
        </div>

        <div className="flex items-center justify-between pt-4">
          <a
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-primary"
          >
            Forgot your password?
          </a>
          <Button type="submit" disabled={isFormLoading}>
            {isFormLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Login
          </Button>
        </div>
      </form>
    </FormStateDisplay>
  )
}
