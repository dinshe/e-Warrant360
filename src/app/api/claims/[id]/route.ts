import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { claimUpdateSchema } from '@/lib/validations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { id } = await params

  const claim = await prisma.warrantyClaim.findFirst({
    where: { id, shopId },
    include: {
      warranty: {
        include: {
          customer: true,
          product: true,
        },
      },
      handledBy: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: 'desc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: claim })
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
  if (!role || !['OWNER', 'ADMIN', 'STAFF'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.warrantyClaim.findFirst({
    where: { id, shopId },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = claimUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const now = new Date()
  const statusDates: Record<string, Date> = {}
  if (parsed.data.status === 'UNDER_REVIEW') statusDates.reviewedAt = now
  if (['COMPLETED', 'CLOSED', 'REPAIRED', 'REPLACED'].includes(parsed.data.status)) {
    statusDates.resolvedAt = now
    statusDates.completedAt = now
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claim = await tx.warrantyClaim.update({
      where: { id },
      data: {
        status: parsed.data.status as never,
        inspectionNotes: parsed.data.inspectionNotes || null,
        repairNotes: parsed.data.repairNotes || null,
        rejectionReason: parsed.data.rejectionReason || null,
        replacementInfo: parsed.data.replacementInfo || null,
        handledById: session.user.id!,
        ...statusDates,
      },
    })

    await tx.claimEvent.create({
      data: {
        claimId: id,
        fromStatus: existing.status,
        toStatus: parsed.data.status as never,
        actorId: session.user.id!,
        actorName: session.user.name ?? 'Staff',
        note: parsed.data.note,
      },
    })

    await tx.auditLog.create({
      data: {
        shopId,
        actorId: session.user.id!,
        actorName: session.user.name ?? 'Staff',
        action: 'CLAIM_UPDATED',
        entityType: 'WarrantyClaim',
        entityId: id,
        metadata: { fromStatus: existing.status, toStatus: parsed.data.status },
      },
    })

    return claim
  })

  return NextResponse.json({ data: updated })
}
