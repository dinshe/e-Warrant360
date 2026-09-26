import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { claimCreateSchema } from '@/lib/validations'
import { generateClaimNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const status = searchParams.get('status')

  const where = {
    shopId,
    ...(status && { status: status as never }),
  }

  const [claims, total] = await Promise.all([
    prisma.warrantyClaim.findMany({
      where,
      include: {
        warranty: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            product: { select: { id: true, name: true, brand: true } },
          },
        },
        handledBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.warrantyClaim.count({ where }),
  ])

  return NextResponse.json({
    data: claims,
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
    const parsed = claimCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    // Verify warranty belongs to this shop and is claimable
    const warranty = await prisma.warranty.findFirst({
      where: { id: parsed.data.warrantyId, shopId },
    })
    if (!warranty) return NextResponse.json({ error: 'Warranty not found' }, { status: 404 })
    if (warranty.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot claim warranty with status: ${warranty.status}` },
        { status: 400 },
      )
    }

    // Check warranty is not expired
    if (warranty.warrantyEndDate < new Date()) {
      return NextResponse.json({ error: 'Warranty has expired' }, { status: 400 })
    }

    const claimNumber = generateClaimNumber()

    const claim = await prisma.$transaction(async (tx) => {
      const newClaim = await tx.warrantyClaim.create({
        data: {
          shopId,
          warrantyId: parsed.data.warrantyId,
          claimNumber,
          reportedIssue: parsed.data.reportedIssue,
          status: 'SUBMITTED',
        },
        include: {
          warranty: {
            include: {
              customer: { select: { name: true } },
              product: { select: { name: true } },
            },
          },
        },
      })

      await tx.warrantyEvent.create({
        data: {
          warrantyId: parsed.data.warrantyId,
          fromStatus: 'ACTIVE',
          toStatus: 'CLAIMED',
          actorId: session.user.id!,
          actorName: session.user.name ?? 'Staff',
          note: `Claim ${claimNumber} submitted`,
        },
      })

      await tx.warranty.update({
        where: { id: parsed.data.warrantyId },
        data: { status: 'CLAIMED' },
      })

      await tx.auditLog.create({
        data: {
          shopId,
          actorId: session.user.id!,
          actorName: session.user.name ?? 'Staff',
          action: 'CLAIM_CREATED',
          entityType: 'WarrantyClaim',
          entityId: newClaim.id,
          metadata: { claimNumber },
        },
      })

      return newClaim
    })

    return NextResponse.json({ data: claim }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create claim'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
