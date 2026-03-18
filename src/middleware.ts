import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/home', '/board', '/test']
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

const isProtectedPath = (pathname: string): boolean =>
  PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

const isAuthPath = (pathname: string): boolean =>
  AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value
  const isAuthenticated = Boolean(accessToken)

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
