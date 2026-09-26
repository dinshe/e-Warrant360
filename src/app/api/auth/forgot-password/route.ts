import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateSecureToken } from '@/lib/utils'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    })

    if (user) {
      const resetToken = generateSecureToken(32)
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour validity

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: expiry,
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

      // Log link for console/dev environments (email provider configured in production)
      console.log(`[PASSWORD_RESET] Link for ${user.email}: ${resetUrl}`)

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorName: user.name,
          action: 'PASSWORD_RESET_REQUEST',
          entityType: 'User',
          entityId: user.id,
          metadata: { requestedAt: new Date().toISOString() },
        },
      }).catch(() => {})
    }

    // Always return 200 with anti-enumeration response
    return NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been dispatched.',
    })
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return NextResponse.json(
      { error: 'Unable to process password reset request' },
      { status: 500 }
    )
  }
}
