import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { transitionWarrantyStatus } from '@/lib/services/warranty.service'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['UPDATE_STATUS', 'TRANSFER', 'REPLACE']).optional(),
  status: z
    .enum([
      'ACTIVE',
      'EXPIRED',
      'VOIDED',
      'CANCELLED',
      'TRANSFERRED',
      'CLAIMED',
      'UNDER_SERVICE',
      'REPAIRED',
      'REPLACED',
      'COMPLETED',
      'REJECTED',
    ])
    .optional(),
  note: z.string().max(1000).optional(),
  newCustomerId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  newSerialNumber: z.string().max(200).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { id } = await params

  const warranty = await prisma.warranty.findFirst({
    where: { id, shopId }, // Tenant-isolated
    include: {
      customer: true,
      product: { include: { category: true } },
      issuedBy: { select: { id: true, name: true, email: true } },
      claims: {
        orderBy: { createdAt: 'desc' },
        include: { events: { orderBy: { createdAt: 'desc' } } },
      },
      events: { orderBy: { createdAt: 'desc' } },
      transfers: { orderBy: { createdAt: 'desc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!warranty) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: warranty })
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

  try {
    const body = await req.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { action = 'UPDATE_STATUS', status, note, notes, newCustomerId, newSerialNumber } =
      parsed.data

    const existingWarranty = await prisma.warranty.findFirst({
      where: { id, shopId },
      include: { customer: true },
    })

    if (!existingWarranty) {
      return NextResponse.json({ error: 'Warranty not found' }, { status: 404 })
    }

    const actorId = session.user.id!
    const actorName = session.user.name ?? 'Staff'

    // ─── 1. TRANSFER ACTION (Section 11) ─────────────────────────────────
    if (action === 'TRANSFER') {
      if (!newCustomerId) {
        return NextResponse.json({ error: 'New customer ID is required' }, { status: 400 })
      }

      const newCustomer = await prisma.customer.findFirst({
        where: { id: newCustomerId, shopId, deletedAt: null },
      })
      if (!newCustomer) {
        return NextResponse.json({ error: 'Target customer not found' }, { status: 404 })
      }

      const result = await prisma.$transaction(async (tx) => {
        // Record transfer history
        await tx.warrantyTransfer.create({
          data: {
            warrantyId: id,
            fromCustomerId: existingWarranty.customerId,
            toCustomerId: newCustomer.id,
            fromCustomerName: existingWarranty.customer.name,
            toCustomerName: newCustomer.name,
            transferDate: new Date(),
            authorizedById: actorId,
            authorizedByName: actorName,
            notes: notes || 'Ownership transferred',
          },
        })

        // Update warranty customer pointer
        const updated = await tx.warranty.update({
          where: { id },
          data: { customerId: newCustomer.id },
        })

        // Add event
        await tx.warrantyEvent.create({
          data: {
            warrantyId: id,
            fromStatus: existingWarranty.status,
            toStatus: existingWarranty.status,
            actorId,
            actorName,
            note: `Warranty transferred from ${existingWarranty.customer.name} to ${newCustomer.name}`,
          },
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            shopId,
            actorId,
            actorName,
            action: 'WARRANTY_TRANSFERRED',
            entityType: 'Warranty',
            entityId: id,
            metadata: {
              fromCustomerId: existingWarranty.customerId,
              toCustomerId: newCustomer.id,
              warrantyNumber: existingWarranty.warrantyNumber,
            },
          },
        })

        return updated
      })

      return NextResponse.json({ data: result })
    }

    // ─── 2. REPLACEMENT ACTION (Section 12) ──────────────────────────────
    if (action === 'REPLACE') {
      if (!newSerialNumber) {
        return NextResponse.json({ error: 'Replacement serial number is required' }, { status: 400 })
      }

      const result = await prisma.$transaction(async (tx) => {
        const oldSerial = existingWarranty.serialNumber || 'N/A'

        const updated = await tx.warranty.update({
          where: { id },
          data: {
            serialNumber: newSerialNumber,
            status: 'ACTIVE',
          },
        })

        await tx.warrantyEvent.create({
          data: {
            warrantyId: id,
            fromStatus: existingWarranty.status,
            toStatus: 'ACTIVE',
            actorId,
            actorName,
            note: `Unit replaced. Old serial: ${oldSerial} -> New serial: ${newSerialNumber}. ${notes || ''}`.trim(),
          },
        })

        await tx.auditLog.create({
          data: {
            shopId,
            actorId,
            actorName,
            action: 'WARRANTY_UPDATED',
            entityType: 'Warranty',
            entityId: id,
            metadata: {
              event: 'REPLACEMENT',
              oldSerialNumber: oldSerial,
              newSerialNumber,
              reason: notes,
            },
          },
        })

        return updated
      })

      return NextResponse.json({ data: result })
    }

    // ─── 3. STANDARD STATUS UPDATE ───────────────────────────────────────
    if (!status) {
      return NextResponse.json({ error: 'Target status is required' }, { status: 400 })
    }

    const updated = await transitionWarrantyStatus(
      id,
      shopId,
      status as never,
      actorId,
      actorName,
      note || notes,
    )

    return NextResponse.json({ data: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
