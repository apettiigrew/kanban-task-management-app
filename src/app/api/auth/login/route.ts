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

const loginRequestSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = validateRequestBody(loginRequestSchema, body)

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'AUTHENTICATION_ERROR',
          timestamp: new Date().toISOString(),
          path: '/api/auth/login',
        },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'AUTHENTICATION_ERROR',
          timestamp: new Date().toISOString(),
          path: '/api/auth/login',
        },
        { status: 401 }
      )
    }

    return createSuccessResponse(
      {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      'Login successful',
      200
    )
  } catch (error) {
    return handleAPIError(error, '/api/auth/login')
  }
}
