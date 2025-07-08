import { z } from 'zod'

// Type definitions for API error responses
export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: Array<{
    field: string
    message: string
    code?: string
  }>
  timestamp: string
  path?: string
}

export interface ValidationErrorDetail {
  field: string
  message: string
  code?: string
}

// Type for parsed form errors
export interface FormErrorState {
  general?: string
  fields: Record<string, string>
}

// Custom error class for form handling
export class FormError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'FormError'
  }
}

// Check if an error is a fetch response error
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    error.success === false &&
    'error' in error &&
    typeof (error as any).error === 'string'
  )
}

// Parse API error response into form-friendly format
export function parseApiError(error: unknown): FormErrorState {
  const formError: FormErrorState = {
    fields: {}
  }

  // Handle direct API error response objects
  if (isApiErrorResponse(error)) {
    formError.general = error.error

    // Parse validation error details if present
    if (error.details && Array.isArray(error.details)) {
      error.details.forEach(detail => {
        if (detail.field && detail.message) {
          formError.fields[detail.field] = detail.message
        }
      })
    }

    return formError
  }

  // Handle Error objects that might contain response data
  if (error instanceof Error) {
    try {
      // Try to parse error message as JSON (in case it contains API response)
      const errorData = JSON.parse(error.message)
      if (isApiErrorResponse(errorData)) {
        return parseApiError(errorData)
      }
    } catch {
      // If parsing fails, treat as general error
    }

    formError.general = error.message
    return formError
  }

  // Handle fetch response errors
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    
    if (errorObj.message) {
      formError.general = errorObj.message
    } else if (errorObj.error) {
      formError.general = errorObj.error
    } else {
      formError.general = 'An unexpected error occurred'
    }

    return formError
  }

  // Fallback for unknown error types
  formError.general = 'An unexpected error occurred'
  return formError
}

// Enhanced API client function that properly handles and parses errors
export async function apiRequest<T>( url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const result = await response.json()

    if (!response.ok) {
      // If the response has a structured error format, use it
      if (isApiErrorResponse(result)) {
        throw new FormError(result.error, parseFieldErrors(result.details))
      }
      
      // Otherwise create a generic error
      throw new FormError(
        result.error || `Request failed: ${response.status} ${response.statusText}`,
        {},
        result
      )
    }

    if (!result.success) {
      if (isApiErrorResponse(result)) {
        throw new FormError(result.error, parseFieldErrors(result.details))
      }
      
      throw new FormError(result.error || 'Request failed', {}, result)
    }

    return result.data
  } catch (error) {
    // Re-throw FormError as-is
    if (error instanceof FormError) {
      throw error
    }

    // Handle fetch errors and other network issues
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new FormError('Network error. Please check your connection and try again.')
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new FormError('Invalid response from server. Please try again.')
    }

    // Handle other errors
    if (error instanceof Error) {
      throw new FormError(error.message, {}, error)
    }

    // Fallback for unknown errors
    throw new FormError('An unexpected error occurred', {}, error)
  }
}

// Helper function to convert validation details to field errors
function parseFieldErrors(details?: ValidationErrorDetail[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  
  if (details && Array.isArray(details)) {
    details.forEach(detail => {
      if (detail.field && detail.message) {
        fieldErrors[detail.field] = detail.message
      }
    })
  }
  
  return fieldErrors
}

// Utility function to merge React Hook Form errors with server errors
export function mergeFormErrors(
  hookFormErrors: Record<string, any>,
  serverErrors: Record<string, string>
): Record<string, string> {
  const mergedErrors: Record<string, string> = {}

  // Add hook form validation errors
  Object.keys(hookFormErrors).forEach(field => {
    const error = hookFormErrors[field]
    if (error?.message) {
      mergedErrors[field] = error.message
    }
  })

  // Server errors take precedence
  Object.keys(serverErrors).forEach(field => {
    mergedErrors[field] = serverErrors[field]
  })

  return mergedErrors
}

// React Hook Form integration helper - updated for better type safety
export function setFormErrors<T extends Record<string, any>>(
  setError: (name: keyof T, error: { type: string; message: string }) => void,
  errors: Record<string, string>
): void {
  Object.keys(errors).forEach(field => {
    // Only set errors for fields that exist in the form schema
    if (field in errors) {
      setError(field as keyof T, {
        type: 'server',
        message: errors[field]
      })
    }
  })
}

// TanStack Query error handler that extracts form errors
export function createFormErrorHandler(
  onFieldErrors?: (errors: Record<string, string>) => void,
  onGeneralError?: (message: string) => void
) {
  return (error: unknown) => {
    const formError = parseApiError(error)
    
    if (Object.keys(formError.fields).length > 0) {
      onFieldErrors?.(formError.fields)
    }
    
    if (formError.general) {
      onGeneralError?.(formError.general)
    }
  }
}

// Utility to check if any field errors exist
export function hasFieldErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0
}

// Utility to get the first field error
export function getFirstFieldError(errors: Record<string, string>): string | undefined {
  const firstKey = Object.keys(errors)[0]
  return firstKey ? errors[firstKey] : undefined
} 