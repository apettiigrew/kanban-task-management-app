import type { NextRequest } from 'next/server'
import { UnauthorizedError } from '@/lib/api-error-handler'

interface CognitoJWTPayload {
  sub: string
  [key: string]: unknown
}

export const getUserIdFromRequest = (request: NextRequest): string => {
  const idToken = request.cookies.get('idToken')?.value
  if (!idToken) throw new UnauthorizedError()

  const parts = idToken.split('.')
  if (parts.length !== 3) throw new UnauthorizedError()

  const [, payloadB64] = parts
  const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
  const payload = JSON.parse(
    Buffer.from(padded, 'base64').toString('utf8')
  ) as CognitoJWTPayload

  if (!payload.sub) throw new UnauthorizedError()

  return payload.sub
}
