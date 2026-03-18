import { ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider'
import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { cognitoClient, COGNITO_CLIENT_ID } from '@/lib/cognito'
import { authSchemas } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'

const COGNITO_ERROR_MAP: Record<string, { field: string; message: string; code: string }> = {
  CodeMismatchException: {
    field: 'code',
    message: 'Invalid verification code. Please try again.',
    code: 'CODE_MISMATCH',
  },
  ExpiredCodeException: {
    field: 'code',
    message: 'Verification code has expired. Please request a new one.',
    code: 'CODE_EXPIRED',
  },
  UserNotFoundException: {
    field: 'email',
    message: 'No account found with this email address.',
    code: 'USER_NOT_FOUND',
  },
  NotAuthorizedException: {
    field: 'email',
    message: 'This account has already been confirmed.',
    code: 'ALREADY_CONFIRMED',
  },
}

// POST /api/auth/confirm-registration - Confirm email verification code via Cognito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = validateRequestBody(authSchemas.confirmRegistration, body)

    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: validatedData.email,
      ConfirmationCode: validatedData.code,
    })

    await cognitoClient.send(command)

    return createSuccessResponse(
      null,
      'Email verified successfully. You can now log in.',
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
          path: '/api/auth/confirm-registration',
        },
        { status: 400 }
      )
    }

    return handleAPIError(error, '/api/auth/confirm-registration')
  }
}
