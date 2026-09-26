import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
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
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null
        }

        // Check account status
        if (user.status === 'SUSPENDED') return null

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          // Increment failed attempts, lock after 5
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isPlatformAdmin: user.isPlatformAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isPlatformAdmin = (user as any).isPlatformAdmin
      }
      return token
    },
    async session({ session, token }) {
      const userId = (token?.id as string) || (token?.sub as string)
      if (session.user && userId) {
        session.user.id = userId
        // Fetch shop context — always fresh from DB, never from client
        const shopUser = await prisma.shopUser.findFirst({
          where: { userId, isActive: true },
          include: {
            shop: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        })
        ;(session.user as any).shopId = shopUser?.shopId ?? null
        ;(session.user as any).shopSlug = shopUser?.shop?.slug ?? null
        ;(session.user as any).shopName = shopUser?.shop?.name ?? null
        ;(session.user as any).role = shopUser?.role ?? null
        ;(session.user as any).isPlatformAdmin = (token.isPlatformAdmin as boolean) ?? false
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
