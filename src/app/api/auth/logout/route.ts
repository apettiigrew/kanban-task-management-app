import { GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider'
import { createSuccessResponse, handleAPIError } from '@/lib/api-error-handler'
import { cognitoClient } from '@/lib/cognito'
import { NextRequest } from 'next/server'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 0,
}

// POST /api/auth/logout - Invalidate Cognito tokens and clear auth cookies
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value

    if (accessToken) {
      await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }))
    }

    const response = createSuccessResponse(null, 'Logged out successfully.', 200)

    response.cookies.set('accessToken', '', COOKIE_CLEAR_OPTIONS)
    response.cookies.set('idToken', '', COOKIE_CLEAR_OPTIONS)
    response.cookies.set('refreshToken', '', COOKIE_CLEAR_OPTIONS)

    return response
  } catch (error) {
    return handleAPIError(error, '/api/auth/logout')
  }
}
