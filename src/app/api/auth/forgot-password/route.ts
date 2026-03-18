import { ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody,
} from '@/lib/api-error-handler'
import { cognitoClient, COGNITO_CLIENT_ID } from '@/lib/cognito'
import { authSchemas } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'

const COGNITO_ERROR_MAP: Record<string, { field: string; message: string; code: string }> = {
  UserNotFoundException: {
    field: 'email',
    message: 'No account found with this email address.',
    code: 'USER_NOT_FOUND',
  },
  InvalidParameterException: {
    field: 'email',
    message: 'Account is not yet confirmed. Please verify your email first.',
    code: 'USER_NOT_CONFIRMED',
  },
  LimitExceededException: {
    field: 'email',
    message: 'Too many requests. Please wait a moment before trying again.',
    code: 'LIMIT_EXCEEDED',
  },
  NotAuthorizedException: {
    field: 'email',
    message: 'Password reset is not allowed for this account.',
    code: 'NOT_AUTHORIZED',
  },
}

// POST /api/auth/forgot-password - Trigger Cognito forgot password flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateRequestBody(authSchemas.forgotPassword, body)

    const command = new ForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: validatedData.email,
    })

    await cognitoClient.send(command)

    return createSuccessResponse(
      { email: validatedData.email },
      'A password reset code has been sent to your email.',
      200
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
          path: '/api/auth/forgot-password',
        },
        { status: 400 }
      )
    }

    return handleAPIError(error, '/api/auth/forgot-password')
  }
}
