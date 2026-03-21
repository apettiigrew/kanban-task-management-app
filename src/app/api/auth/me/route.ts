import {
  createSuccessResponse,
  handleAPIError,
  UnauthorizedError,
} from '@/lib/api-error-handler'
import type { NextRequest } from 'next/server'

interface CognitoIdTokenPayload {
  sub: string
  email: string
  name?: string
  'cognito:username'?: string
  [key: string]: unknown
}

// GET /api/auth/me - Returns the signed-in user's profile from the Cognito idToken cookie
export async function GET(request: NextRequest) {
  try {
    const idToken = request.cookies.get('idToken')?.value
    if (!idToken) throw new UnauthorizedError()

    const parts = idToken.split('.')
    if (parts.length !== 3) throw new UnauthorizedError()

    const [, payloadB64] = parts
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(
      Buffer.from(padded, 'base64').toString('utf8')
    ) as CognitoIdTokenPayload

    if (!payload.sub || !payload.email) throw new UnauthorizedError()

    const name =
      payload.name ??
      payload['cognito:username'] ??
      payload.email.split('@')[0]

    return createSuccessResponse({
      email: payload.email,
      name,
    })
  } catch (error) {
    return handleAPIError(error, '/api/auth/me')
  }
}
