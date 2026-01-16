"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError, setFormErrors } from "@/lib/form-error-handler"
import { useRegisterUser } from "@/hooks/mutations/use-auth-mutations"
import { authSchemas, type RegisterSchema } from "@/utils/validation-schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import React from "react"
import { useForm } from "react-hook-form"
import { FieldError, FormStateDisplay, useFormErrorState } from "./ui/form-error"

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm<RegisterSchema>({
    resolver: zodResolver(authSchemas.register),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
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

  const registerUserMutation = useRegisterUser()

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      clearFormErrors()
    }
  }, [errors, clearFormErrors])

  const handleFormErrors = React.useCallback((error: FormError) => {
    if (Object.keys(error.fieldErrors).length > 0) {
      setFormErrors<RegisterSchema>(setError, error.fieldErrors)
      setMultipleFieldErrors(error.fieldErrors)
    } else {
      setGeneralError(error.message)
    }
  }, [setError, setMultipleFieldErrors, setGeneralError])

  const onSubmit = async (data: RegisterSchema) => {
    clearFormErrors()
    clearErrors()

    const { confirmPassword, ...registerData } = data
      
    registerUserMutation.mutate(registerData, {
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

  const isFormLoading = isSubmitting || registerUserMutation.isPending

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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="Confirm your password"
            disabled={isFormLoading}
            aria-invalid={!!(errors.confirmPassword || fieldErrors.confirmPassword)}
            className={errors.confirmPassword || fieldErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <FieldError error={errors.confirmPassword?.message || fieldErrors.confirmPassword} />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isFormLoading || hasErrors}>
            {isFormLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Register
          </Button>
        </div>
      </form>
    </FormStateDisplay>
  )
}
