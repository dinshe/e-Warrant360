import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { warrantyCreateSchema } from '@/lib/validations'
import { createWarranty } from '@/lib/services/warranty.service'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const search = searchParams.get('q') ?? ''
  const status = searchParams.get('status')

  const where = {
    shopId, // Tenant isolation — ALWAYS filter by shopId from session
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { warrantyNumber: { contains: search, mode: 'insensitive' as const } },
        { serialNumber: { contains: search, mode: 'insensitive' as const } },
        { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
        { customer: { name: { contains: search, mode: 'insensitive' as const } } },
        { customer: { phone: { contains: search, mode: 'insensitive' as const } } },
        { product: { name: { contains: search, mode: 'insensitive' as const } } },
        { product: { sku: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [warranties, total] = await Promise.all([
    prisma.warranty.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        product: { select: { id: true, name: true, brand: true, modelNumber: true, sku: true } },
        issuedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.warranty.count({ where }),
  ])

  return NextResponse.json({
    data: warranties,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  const role = session.user.role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!role || !['OWNER', 'ADMIN', 'STAFF'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = warrantyCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const warranty = await createWarranty({
      ...parsed.data,
      shopId,
      issuedById: session.user.id!,
      actorName: session.user.name ?? 'Staff',
    })

    return NextResponse.json({ data: warranty }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create warranty'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
