import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = (req as unknown as { auth: { user?: { isPlatformAdmin?: boolean } } | null }).auth
  const isLoggedIn = !!session?.user

  // Always allow static files and API auth routes
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
  const isApiVerify = nextUrl.pathname.startsWith('/api/verify')
  if (isApiAuth || isApiVerify) return NextResponse.next()

  // Public pages
  const publicPaths = [
    '/login',
    '/register',
    '/verify',
    '/forgot-password',
    '/reset-password',
  ]
  const isPublicPath = publicPaths.some((p) => nextUrl.pathname.startsWith(p))

  if (isPublicPath && !isLoggedIn) return NextResponse.next()

  // Redirect authenticated users away from auth pages
  if (isPublicPath && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Require auth for all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect platform-admin-only routes
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!session?.user?.isPlatformAdmin) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
