import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            status: true,
            isPlatformAdmin: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        })

        if (!user || !user.passwordHash) return null

        // Check account lock
        if (user.lockedUntil && user.lockedUntil > new Date()) return null

        // Check account status
        if (user.status === 'SUSPENDED') return null

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1
          const lockUntil =
            attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              ...(lockUntil && { lockedUntil: lockUntil }),
            },
          })
          return null
        }

        // Reset failed attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        })

        // Fetch shop context at login time — stored in JWT, no DB call per request
        const shopUser = await prisma.shopUser.findFirst({
          where: { userId: user.id, isActive: true },
          include: {
            shop: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isPlatformAdmin: user.isPlatformAdmin,
          shopId: shopUser?.shopId ?? null,
          shopSlug: shopUser?.shop?.slug ?? null,
          shopName: shopUser?.shop?.name ?? null,
          role: shopUser?.role ?? null,
        }
      },
    }),
  ],
  callbacks: {
    // Override callbacks from authConfig — runs in Node.js runtime only
    async jwt({ token, user }) {
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
    async session({ session, token }) {
      if (session.user) {
        const userId = (token?.id as string) || (token?.sub as string)
        session.user.id = userId
        ;(session.user as any).isPlatformAdmin = (token.isPlatformAdmin as boolean) ?? false
        ;(session.user as any).shopId = token.shopId ?? null
        ;(session.user as any).shopSlug = token.shopSlug ?? null
        ;(session.user as any).shopName = token.shopName ?? null
        ;(session.user as any).role = token.role ?? null
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await prisma.auditLog
          .create({
            data: {
              actorId: user.id,
              actorEmail: user.email ?? '',
              actorName: user.name ?? '',
              action: 'LOGIN',
            },
          })
          .catch(() => {})
      }
    },
  },
})
