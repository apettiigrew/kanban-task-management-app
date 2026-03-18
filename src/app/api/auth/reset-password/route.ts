import { ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody,
} from '@/lib/api-error-handler'
import { cognitoClient, COGNITO_CLIENT_ID } from '@/lib/cognito'
import { z } from 'zod'
import { commonValidations } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'

// confirmPassword is client-side only — only validate email, code, newPassword server-side
const resetPasswordRequestSchema = z.object({
  email: commonValidations.email,
  code: z.string().length(6, 'Code must be 6 characters'),
  newPassword: commonValidations.password,
})

const COGNITO_ERROR_MAP: Record<string, { field: string; message: string; code: string }> = {
  CodeMismatchException: {
    field: 'code',
    message: 'Invalid reset code. Please check and try again.',
    code: 'CODE_MISMATCH',
  },
  ExpiredCodeException: {
    field: 'code',
    message: 'Reset code has expired. Please request a new one.',
    code: 'CODE_EXPIRED',
  },
  UserNotFoundException: {
    field: 'email',
    message: 'No account found with this email address.',
    code: 'USER_NOT_FOUND',
  },
  InvalidPasswordException: {
    field: 'newPassword',
    message: 'Password does not meet the security requirements.',
    code: 'INVALID_PASSWORD',
  },
  LimitExceededException: {
    field: 'code',
    message: 'Too many attempts. Please wait before trying again.',
    code: 'LIMIT_EXCEEDED',
  },
  InvalidParameterException: {
    field: 'code',
    message: 'Invalid request. Please request a new reset code.',
    code: 'INVALID_PARAMETER',
  },
}

// POST /api/auth/reset-password - Confirm password reset with code and new password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateRequestBody(resetPasswordRequestSchema, body)

    const command = new ConfirmForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: validatedData.email,
      ConfirmationCode: validatedData.code,
      Password: validatedData.newPassword,
    })

    await cognitoClient.send(command)

    return createSuccessResponse(
      null,
      'Password reset successfully. You can now log in with your new password.',
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
          path: '/api/auth/reset-password',
        },
        { status: 400 }
      )
    }

    return handleAPIError(error, '/api/auth/reset-password')
  }
}
