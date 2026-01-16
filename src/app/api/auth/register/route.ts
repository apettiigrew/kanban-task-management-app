import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { authSchemas, commonValidations } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Schema for register request (without confirmPassword)
const registerRequestSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password
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

    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
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
