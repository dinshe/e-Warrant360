import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { productSchema } from '@/lib/validations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, shopId, deletedAt: null },
    include: { category: true },
  })

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: product })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  const role = (session.user as any).role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!role || !['OWNER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.product.findFirst({
    where: { id, shopId, deletedAt: null },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...parsed.data,
      purchaseCost: parsed.data.purchaseCost ?? null,
      sellingPrice: parsed.data.sellingPrice ?? null,
      brand: parsed.data.brand || null,
      modelNumber: parsed.data.modelNumber || null,
      barcode: parsed.data.barcode || null,
      description: parsed.data.description || null,
      warrantyTerms: parsed.data.warrantyTerms || null,
      warrantyExclusions: parsed.data.warrantyExclusions || null,
      sku: parsed.data.sku || null,
    },
    include: { category: true },
  })

  await prisma.auditLog.create({
    data: {
      shopId,
      actorId: session.user.id!,
      actorName: session.user.name ?? 'Staff',
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
    },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  const role = (session.user as any).role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!role || !['OWNER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.product.findFirst({
    where: { id, shopId, deletedAt: null },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft delete
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  })

  await prisma.auditLog.create({
    data: {
      shopId,
      actorId: session.user.id!,
      actorName: session.user.name ?? 'Staff',
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: id,
    },
  })

  return NextResponse.json({ success: true })
}
