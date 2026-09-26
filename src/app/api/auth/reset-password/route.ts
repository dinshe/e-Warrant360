import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { passwordResetSchema } from '@/lib/validations'
import { z } from 'zod'

const resetPayloadSchema = passwordResetSchema.and(
  z.object({
    token: z.string().min(1, 'Token is required'),
  })
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resetPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.name,
        action: 'PASSWORD_RESET_COMPLETE',
        entityType: 'User',
        entityId: user.id,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully updated. You may now sign in.',
    })
  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    )
  }
}
