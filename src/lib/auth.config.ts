import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe auth config — no Prisma, no bcrypt.
 * Imported by middleware.ts (Edge runtime) for route protection.
 * Full auth (with Prisma) is in auth.ts (Node.js runtime only).
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' as const },
  providers: [], // Providers added in auth.ts
  callbacks: {
    jwt({ token, user }) {
      // Runs in Node.js (via auth.ts). Store shop context in JWT at login.
      if (user) {
        token.id = user.id
        token.isPlatformAdmin = (user as any).isPlatformAdmin ?? false
        token.shopId = (user as any).shopId ?? null
        token.shopSlug = (user as any).shopSlug ?? null
        token.shopName = (user as any).shopName ?? null
        token.role = (user as any).role ?? null
      }
      return token
    },
    session({ session, token }) {
      // Runs in Node.js (via auth.ts). Read shop context from JWT — no DB call.
      if (session.user) {
        session.user.id = (token?.id as string) || (token?.sub as string)
        ;(session.user as any).isPlatformAdmin = (token.isPlatformAdmin as boolean) ?? false
        ;(session.user as any).shopId = token.shopId ?? null
        ;(session.user as any).shopSlug = token.shopSlug ?? null
        ;(session.user as any).shopName = token.shopName ?? null
        ;(session.user as any).role = token.role ?? null
      }
      return session
    },
  },
} satisfies NextAuthConfig
