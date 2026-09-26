import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { customerSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const search = searchParams.get('q') ?? ''

  const where = {
    shopId,
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { customerRef: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({
    data: customers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = customerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { phone, ...rest } = parsed.data

    // Check phone uniqueness within shop
    if (phone) {
      const existing = await prisma.customer.findFirst({
        where: { shopId, phone, deletedAt: null },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'A customer with this phone number already exists' },
          { status: 409 },
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        shopId,
        phone: phone || null,
        email: rest.email || null,
        addressLine1: rest.addressLine1 || null,
        city: rest.city || null,
        district: rest.district || null,
        notes: rest.notes || null,
        name: rest.name,
      },
    })

    await prisma.auditLog.create({
      data: {
        shopId,
        actorId: session.user.id!,
        actorName: session.user.name ?? 'Staff',
        action: 'CUSTOMER_CREATED',
        entityType: 'Customer',
        entityId: customer.id,
      },
    })

    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create customer'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
