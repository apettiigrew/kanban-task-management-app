import { InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody,
} from '@/lib/api-error-handler'
import { cognitoClient, COGNITO_CLIENT_ID } from '@/lib/cognito'
import { authSchemas } from '@/utils/validation-schemas'
import { NextRequest, NextResponse } from 'next/server'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const COGNITO_ERROR_MAP: Record<string, { field: string; message: string; code: string }> = {
  NotAuthorizedException: {
    field: 'password',
    message: 'Incorrect email or password.',
    code: 'INVALID_CREDENTIALS',
  },
  UserNotFoundException: {
    field: 'email',
    message: 'No account found with this email address.',
    code: 'USER_NOT_FOUND',
  },
  UserNotConfirmedException: {
    field: 'email',
    message: 'Please verify your email address before logging in.',
    code: 'USER_NOT_CONFIRMED',
  },
  PasswordResetRequiredException: {
    field: 'password',
    message: 'A password reset is required. Please reset your password.',
    code: 'PASSWORD_RESET_REQUIRED',
  },
}

// POST /api/auth/login - Authenticate a user via Cognito and set httpOnly cookies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateRequestBody(authSchemas.signIn, body)

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: validatedData.email,
        PASSWORD: validatedData.password,
      },
    })

    const result = await cognitoClient.send(command)
    const tokens = result.AuthenticationResult

    if (!tokens?.AccessToken || !tokens?.IdToken || !tokens?.RefreshToken) {
      throw new Error('Authentication failed: incomplete token response')
    }

    const response = createSuccessResponse(
      { email: validatedData.email },
      'Login successful.',
      200
    )

    const cookieDefaults = {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'strict' as const,
      path: '/',
    }

    response.cookies.set('accessToken', tokens.AccessToken, {
      ...cookieDefaults,
      maxAge: 3600,
    })
    response.cookies.set('idToken', tokens.IdToken, {
      ...cookieDefaults,
      maxAge: 3600,
    })
    response.cookies.set('refreshToken', tokens.RefreshToken, {
      ...cookieDefaults,
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
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
          path: '/api/auth/login',
        },
        { status: 401 }
      )
    }

    return handleAPIError(error, '/api/auth/login')
  }
}
