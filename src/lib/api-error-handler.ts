import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Custom error types
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public details?: z.ZodError) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

// Error response interface
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
  timestamp: string
  path?: string
}

// Success response interface
interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  timestamp: string
}

// Main error handler function
export function handleAPIError(
  error: unknown,
  path?: string
): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString()
  
  // Handle known error types
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        timestamp,
        path,
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
        timestamp,
        path,
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: 'A record with this information already exists',
            code: 'DUPLICATE_RECORD',
            timestamp,
            path,
          },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: 'Record not found',
            code: 'RECORD_NOT_FOUND',
            timestamp,
            path,
          },
          { status: 404 }
        )
      case 'P2003':
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid reference to related record',
            code: 'FOREIGN_KEY_CONSTRAINT',
            timestamp,
            path,
          },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Database operation failed',
            code: 'DATABASE_ERROR',
            timestamp,
            path,
          },
          { status: 500 }
        )
    }
  }

  // Handle Prisma connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        code: 'DATABASE_CONNECTION_ERROR',
        timestamp,
        path,
      },
      { status: 503 }
    )
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        code: 'INTERNAL_ERROR',
        timestamp,
        path,
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp,
      path,
    },
    { status: 500 }
  )
}

// Success response helper
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

// Validation helper with detailed error handling
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Request validation failed', error)
    }
    throw error
  }
}

// Async handler wrapper for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Extract path from request if available
      const request = args.find(arg => arg && typeof arg.url === 'string')
      const path = request ? new URL(request.url).pathname : undefined
      
      throw handleAPIError(error, path)
    }
  }
}

// Request sanitization helpers
export function sanitizeStringInput(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined
  return input.trim().slice(0, 1000) // Limit length and trim whitespace
}

export function sanitizeArrayInput<T>(
  input: unknown,
  maxLength: number = 100
): T[] | undefined {
  if (!Array.isArray(input)) return undefined
  return input.slice(0, maxLength) as T[]
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const entry = requestCounts.get(identifier)

  if (!entry || now > entry.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}