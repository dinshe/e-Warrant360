import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const createStaffSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  role: z.enum(['ADMIN', 'STAFF']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  const userRole = (session.user as any).role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!['OWNER', 'ADMIN'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createStaffSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, email, password, role } = parsed.data

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Check if already in this shop
      const existingShopUser = await prisma.shopUser.findUnique({
        where: { shopId_userId: { shopId, userId: user.id } },
      })
      if (existingShopUser) {
        return NextResponse.json(
          { error: 'User is already a member of this shop' },
          { status: 400 },
        )
      }
    } else {
      // Create user
      const passwordHash = await bcrypt.hash(password, 12)
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      })
    }

    // Link user to shop with specified role
    const shopUser = await prisma.shopUser.create({
      data: {
        shopId,
        userId: user.id,
        role: role as any,
        isActive: true,
      },
    })

    // Record audit log
    await prisma.auditLog.create({
      data: {
        shopId,
        actorId: session.user.id,
        actorName: session.user.name,
        action: 'STAFF_INVITED',
        entityType: 'ShopUser',
        entityId: shopUser.id,
        metadata: { invitedEmail: email, role },
      },
    })

    return NextResponse.json({ success: true, data: shopUser }, { status: 201 })
  } catch (err: any) {
    console.error('[STAFF_CREATE]', err)
    return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 })
  }
}
