import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider'
import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { cognitoClient, COGNITO_CLIENT_ID } from '@/lib/cognito'
import { commonValidations } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const registerRequestSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password,
})

const COGNITO_ERROR_MAP: Record<string, { field: string; message: string; code: string }> = {
  UsernameExistsException: {
    field: 'email',
    message: 'An account with this email already exists',
    code: 'DUPLICATE_EMAIL',
  },
  InvalidPasswordException: {
    field: 'password',
    message: 'Password does not meet the security requirements',
    code: 'INVALID_PASSWORD',
  },
  InvalidParameterException: {
    field: 'email',
    message: 'Invalid email address',
    code: 'INVALID_PARAMETER',
  },
}

// POST /api/auth/register - Register a new user via Cognito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body (confirmPassword is client-side only)
    const validatedData = validateRequestBody(registerRequestSchema, body)

    const command = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: validatedData.email,
      Password: validatedData.password,
      UserAttributes: [
        { Name: 'email', Value: validatedData.email },
      ],
    })

    await cognitoClient.send(command)

    return createSuccessResponse(
      { email: validatedData.email },
      'Registration successful. Please check your email for a verification code.',
      201
    )
  } catch (error) {
    const cognitoError = error as { name?: string }
    const mapped = cognitoError.name ? COGNITO_ERROR_MAP[cognitoError.name] : undefined

    if (mapped) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [mapped],
          timestamp: new Date().toISOString(),
          path: '/api/auth/register',
        },
        { status: 400 }
      )
    }

    return handleAPIError(error, '/api/auth/register')
  }
}
