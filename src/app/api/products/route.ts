import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { productSchema } from '@/lib/validations'

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
        { brand: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { modelNumber: { contains: search, mode: 'insensitive' as const } },
        { barcode: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({
    data: products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  const role = session.user.role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!role || !['OWNER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { sku, ...rest } = parsed.data

    // Check SKU uniqueness within shop
    if (sku) {
      const existing = await prisma.product.findFirst({
        where: { shopId, sku, deletedAt: null },
      })
      if (existing) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
      }
    }

    const product = await prisma.product.create({
      data: {
        shopId,
        sku: sku || null,
        ...rest,
        purchaseCost: rest.purchaseCost ?? null,
        sellingPrice: rest.sellingPrice ?? null,
        brand: rest.brand || null,
        modelNumber: rest.modelNumber || null,
        barcode: rest.barcode || null,
        description: rest.description || null,
        warrantyTerms: rest.warrantyTerms || null,
        warrantyExclusions: rest.warrantyExclusions || null,
      },
      include: { category: true },
    })

    await prisma.auditLog.create({
      data: {
        shopId,
        actorId: session.user.id!,
        actorName: session.user.name ?? 'Staff',
        action: 'PRODUCT_CREATED',
        entityType: 'Product',
        entityId: product.id,
      },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
