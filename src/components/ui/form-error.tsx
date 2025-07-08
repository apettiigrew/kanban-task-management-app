import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/utils/utils'

// Component for displaying individual field errors
interface FieldErrorProps {
  error?: string
  className?: string
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null

  return (
    <p 
      className={cn(
        "text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {error}
    </p>
  )
}

// Component for displaying general form errors
interface FormErrorBannerProps {
  error?: string
  onDismiss?: () => void
  className?: string
}

export function FormErrorBanner({ error, onDismiss, className }: FormErrorBannerProps) {
  if (!error) return null

  return (
    <div 
      className={cn(
        "rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md bg-red-50 dark:bg-red-950/20 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-red-950"
                onClick={onDismiss}
                aria-label="Dismiss error"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component for displaying multiple field errors as a summary
interface FormErrorSummaryProps {
  errors: Record<string, string>
  className?: string
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, message]) => message)
  
  if (errorEntries.length === 0) return null

  return (
    <div 
      className={cn(
        "rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Please correct the following errors:
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <ul className="list-disc space-y-1 pl-5">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <span className="font-medium capitalize">{field}:</span> {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for displaying loading state with error fallback
interface FormStateDisplayProps {
  isLoading?: boolean
  error?: string
  fieldErrors?: Record<string, string>
  onErrorDismiss?: () => void
  className?: string
  children?: React.ReactNode
}

export function FormStateDisplay({ 
  isLoading, 
  error, 
  fieldErrors = {}, 
  onErrorDismiss,
  className,
  children 
}: FormStateDisplayProps) {
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean)

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <FormErrorBanner 
          error={error} 
          onDismiss={onErrorDismiss}
        />
      )}
      
      {hasFieldErrors && !error && (
        <FormErrorSummary errors={fieldErrors} />
      )}
      
      {children}
    </div>
  )
}

// Hook for managing form error state
export function useFormErrorState() {
  const [generalError, setGeneralError] = React.useState<string>()
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const clearErrors = React.useCallback(() => {
    setGeneralError(undefined)
    setFieldErrors({})
  }, [])

  const clearGeneralError = React.useCallback(() => {
    setGeneralError(undefined)
  }, [])

  const clearFieldError = React.useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [])

  const setError = React.useCallback((error: string) => {
    setGeneralError(error)
  }, [])

  const setFieldError = React.useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [])

  const setMultipleFieldErrors = React.useCallback((errors: Record<string, string>) => {
    setFieldErrors(errors)
  }, [])

  return {
    generalError,
    fieldErrors,
    setError,
    setFieldError,
    setMultipleFieldErrors,
    clearErrors,
    clearGeneralError,
    clearFieldError,
    hasErrors: !!generalError || Object.values(fieldErrors).some(Boolean),
    hasFieldErrors: Object.values(fieldErrors).some(Boolean),
  }
} 