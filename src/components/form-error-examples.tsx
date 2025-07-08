"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  FieldError, 
  FormErrorBanner, 
  FormErrorSummary, 
  FormStateDisplay,
  useFormErrorState 
} from '@/components/ui/form-error'
import { 
  parseApiError, 
  setFormErrors, 
  FormError,
  ApiErrorResponse 
} from '@/lib/form-error-handler'

// Example schema for testing
const testSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Invalid email address'),
  description: z.string().optional(),
})

type TestFormData = z.infer<typeof testSchema>

// Mock API error responses for testing
const mockApiErrors = {
  // Validation error with field details
  validationError: {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [
      { field: 'title', message: 'Title must be at least 3 characters long' },
      { field: 'email', message: 'Email address is already in use' }
    ],
    timestamp: new Date().toISOString()
  } as ApiErrorResponse,

  // General server error
  serverError: {
    success: false,
    error: 'Internal server error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  } as ApiErrorResponse,

  // Network error simulation
  networkError: new Error('Network error. Please check your connection and try again.'),

  // Custom FormError
  customFormError: new FormError(
    'Custom validation failed',
    { title: 'Custom title error', description: 'Custom description error' }
  )
}

export function FormErrorExamples() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema)
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

  const simulateError = (errorType: keyof typeof mockApiErrors) => {
    clearFormErrors()
    clearErrors()

    const mockError = mockApiErrors[errorType]
    const parsed = parseApiError(mockError)

    if (Object.keys(parsed.fields).length > 0) {
      setFormErrors<TestFormData>(setError, parsed.fields)
      setMultipleFieldErrors(parsed.fields)
    }

    if (parsed.general) {
      setGeneralError(parsed.general)
    }
  }

  const onSubmit = (data: TestFormData) => {
    clearFormErrors()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Form Error Handling Examples</h1>
        <p className="text-gray-600 mb-6">
          This component demonstrates various error handling scenarios for forms with 
          server-side validation feedback and TanStack Query error states.
        </p>
      </div>

      {/* Error Testing Buttons */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Test Error Scenarios</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => simulateError('validationError')}
          >
            Simulate Validation Error
          </Button>
          <Button
            variant="outline"
            onClick={() => simulateError('serverError')}
          >
            Simulate Server Error
          </Button>
          <Button
            variant="outline"
            onClick={() => simulateError('networkError')}
          >
            Simulate Network Error
          </Button>
          <Button
            variant="outline"
            onClick={() => simulateError('customFormError')}
          >
            Simulate Custom Form Error
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearFormErrors()
              clearErrors()
            }}
          >
            Clear All Errors
          </Button>
        </div>
      </div>

      {/* Form with Error Display */}
      <FormStateDisplay
        error={generalError}
        fieldErrors={fieldErrors}
        onErrorDismiss={clearGeneralError}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter title"
              aria-invalid={!!(errors.title || fieldErrors.title)}
              className={errors.title || fieldErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            <FieldError error={errors.title?.message || fieldErrors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email"
              aria-invalid={!!(errors.email || fieldErrors.email)}
              className={errors.email || fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            <FieldError error={errors.email?.message || fieldErrors.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Enter description"
              aria-invalid={!!(errors.description || fieldErrors.description)}
              className={errors.description || fieldErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            <FieldError error={errors.description?.message || fieldErrors.description} />
          </div>

          <Button type="submit" disabled={hasErrors}>
            Submit Form
          </Button>
        </form>
      </FormStateDisplay>

      {/* Standalone Error Components Examples */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Standalone Error Components</h2>
        
        <div>
          <h3 className="text-md font-medium mb-2">FieldError Example</h3>
          <FieldError error="This is a field error message" />
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">FormErrorBanner Example</h3>
          <FormErrorBanner 
            error="This is a general form error message" 
            onDismiss={() => console.log('Error dismissed')}
          />
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">FormErrorSummary Example</h3>
          <FormErrorSummary 
            errors={{
              title: 'Title is required',
              email: 'Email format is invalid',
              description: 'Description is too long'
            }}
          />
        </div>
      </div>

      {/* Current Error State Display */}
      {(hasErrors || Object.keys(errors).length > 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Current Error State</h2>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                generalError,
                fieldErrors,
                hookFormErrors: Object.keys(errors).reduce((acc, key) => {
                  acc[key] = errors[key as keyof typeof errors]?.message
                  return acc
                }, {} as Record<string, any>),
                hasErrors
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 