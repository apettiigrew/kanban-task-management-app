import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { authSchemas } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for register request (without confirmPassword)
const registerRequestSchema = z.object({
  email: authSchemas.register.shape.email,
  password: authSchemas.register.shape.password,
})

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body (email and password only, confirmPassword is client-side only)
    const validatedData = validateRequestBody(registerRequestSchema, body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      // Return field-specific error for duplicate email
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [
            {
              field: 'email',
              message: 'This email is already taken',
              code: 'DUPLICATE_EMAIL',
            },
          ],
          timestamp: new Date().toISOString(),
          path: '/api/auth/register',
        },
        { status: 400 }
      )
    }

    // Create new user
    // Note: In production, password should be hashed before storing
    // For now, storing plain text password (this should be changed)
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: validatedData.password, // TODO: Hash password before storing
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse(
      user,
      'User registered successfully',
      201
    )
  } catch (error) {
    return handleAPIError(error, '/api/auth/register')
  }
}
