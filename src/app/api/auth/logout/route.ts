import { createSuccessResponse } from '@/lib/api-error-handler'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// POST /api/auth/logout - Clear all auth cookies
export async function POST() {
  const response = createSuccessResponse(null, 'Logged out successfully.', 200)

  const clearOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  }

  response.cookies.set('accessToken', '', clearOptions)
  response.cookies.set('idToken', '', clearOptions)
  response.cookies.set('refreshToken', '', clearOptions)

  return response
}
