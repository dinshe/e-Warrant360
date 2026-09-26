import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { registerBaseSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const registerWithShopSchema = registerBaseSchema
  .extend({
    shopName: z.string().min(2).max(200).trim(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerWithShopSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, email, password, shopName } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      // Don't reveal whether the email exists (anti-enumeration)
      return NextResponse.json(
        { error: 'Registration failed. Please check your details.' },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Generate unique shop slug
    let slug = slugify(shopName)
    const existingShop = await prisma.shop.findUnique({ where: { slug } })
    if (existingShop) {
      slug = `${slug}-${Date.now()}`
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name,
          passwordHash,
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      })

      const shop = await tx.shop.create({
        data: {
          name: shopName,
          slug,
          email: normalizedEmail,
          status: 'ACTIVE',
        },
      })

      await tx.shopUser.create({
        data: {
          shopId: shop.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      await tx.auditLog.create({
        data: {
          shopId: shop.id,
          actorId: user.id,
          actorEmail: normalizedEmail,
          actorName: name,
          action: 'REGISTER',
          entityType: 'User',
          entityId: user.id,
        },
      })
    })

    return NextResponse.json({ success: true, message: 'Account created successfully' })
  } catch (err) {
    console.error('[REGISTER]', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
