import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = (req as unknown as { auth: { user?: { isPlatformAdmin?: boolean } } | null }).auth
  const isLoggedIn = !!session?.user

  // Always allow static files and API auth / verify / external integration webhook routes
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
  const isApiVerify = nextUrl.pathname.startsWith('/api/verify')
  const isPosWebhook = nextUrl.pathname.startsWith('/api/integrations/pos/webhook')
  if (isApiAuth || isApiVerify || isPosWebhook) return NextResponse.next()

  // Public pages
  const isHome = nextUrl.pathname === '/'
  const publicPaths = [
    '/login',
    '/register',
    '/verify',
    '/forgot-password',
    '/reset-password',
  ]
  const isPublicPrefix = publicPaths.some((p) => nextUrl.pathname.startsWith(p))
  const isPublicPath = isHome || isPublicPrefix

  // Redirect authenticated users away from dedicated auth entry pages
  const authOnlyPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthOnly = authOnlyPaths.some((p) => nextUrl.pathname.startsWith(p))
  if (isAuthOnly && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (isPublicPath && !isLoggedIn) return NextResponse.next()
  if (isHome && isLoggedIn) return NextResponse.next()

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
