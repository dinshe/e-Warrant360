import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

// Edge-safe: authConfig has no Prisma or bcrypt imports
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const session = (req as any).auth
  const isLoggedIn = !!session?.user

  // Always allow API auth, verify, and POS webhook routes
  if (
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/verify') ||
    nextUrl.pathname.startsWith('/api/integrations/pos/webhook')
  ) {
    return NextResponse.next()
  }

  // Public pages (no auth required)
  const publicPaths = ['/login', '/register', '/verify', '/forgot-password', '/reset-password']
  const isHome = nextUrl.pathname === '/'
  const isPublicPath =
    isHome || publicPaths.some((p) => nextUrl.pathname.startsWith(p))

  // Redirect logged-in users away from auth-only pages
  const authOnlyPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  if (authOnlyPaths.some((p) => nextUrl.pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Allow public paths for unauthenticated users
  if (isPublicPath && !isLoggedIn) return NextResponse.next()

  // Allow home for everyone
  if (isHome) return NextResponse.next()

  // Require auth for all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect platform-admin routes
  if (nextUrl.pathname.startsWith('/admin')) {
    const isPlatformAdmin = session?.user?.isPlatformAdmin
    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|public/).*)'],
}
