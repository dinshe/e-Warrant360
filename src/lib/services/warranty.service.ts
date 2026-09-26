import { prisma } from '@/lib/db'
import {
  generateWarrantyNumber,
  generateSecureToken,
  calculateWarrantyEndDate,
  maskEmail,
  maskPhone,
  maskSerial,
} from '@/lib/utils'
import { warrantyCreateSchema } from '@/lib/validations'
import { WarrantyStatus, WarrantyType } from '@prisma/client'
import { z } from 'zod'

// ─────────────────────────────────────────
// State Machine
// ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<WarrantyStatus, WarrantyStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['CLAIMED', 'EXPIRED', 'VOIDED', 'TRANSFERRED'],
  PENDING: ['ACTIVE', 'CANCELLED'],
  CLAIMED: ['UNDER_SERVICE', 'REJECTED'],
  UNDER_SERVICE: ['REPAIRED', 'REPLACED', 'REJECTED'],
  REPAIRED: ['COMPLETED'],
  REPLACED: ['COMPLETED'],
  COMPLETED: [],
  EXPIRED: [],
  VOIDED: [],
  CANCELLED: [],
  TRANSFERRED: ['ACTIVE'],
  REJECTED: [],
}

export function canTransition(from: WarrantyStatus, to: WarrantyStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type CreateWarrantyInput = z.infer<typeof warrantyCreateSchema> & {
  shopId: string
  issuedById: string
  actorName: string
}

// ─────────────────────────────────────────
// Create Warranty
// ─────────────────────────────────────────

export async function createWarranty(input: CreateWarrantyInput) {
  const { shopId, issuedById, actorName, ...data } = input

  // Idempotency check
  if (data.idempotencyKey) {
    const existing = await prisma.warranty.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    })
    if (existing) return existing
  }

  // Verify product belongs to shop — never trust client-supplied IDs
  const product = await prisma.product.findFirst({
    where: { id: data.productId, shopId, deletedAt: null },
  })
  if (!product) throw new Error('Product not found')

  // Verify customer belongs to shop
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, shopId, deletedAt: null },
  })
  if (!customer) throw new Error('Customer not found')

  // Calculate warranty dates server-side — never trust client-supplied dates for logic
  const purchaseDate = new Date(data.purchaseDate)
  const startDate = data.warrantyStartDate
    ? new Date(data.warrantyStartDate)
    : purchaseDate
  const months = data.warrantyMonths ?? product.defaultWarrantyMonths
  const endDate = calculateWarrantyEndDate(startDate, months)
  const warrantyType = (data.warrantyType ?? product.warrantyType) as WarrantyType

  // Generate unique warranty number with retry
  let warrantyNumber: string = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateWarrantyNumber()
    const existing = await prisma.warranty.findUnique({
      where: { warrantyNumber: candidate },
    })
    if (!existing) {
      warrantyNumber = candidate
      break
    }
  }
  if (!warrantyNumber) throw new Error('Failed to generate unique warranty number')

  const verificationToken = generateSecureToken(24)

  return await prisma.$transaction(async (tx) => {
    const warranty = await tx.warranty.create({
      data: {
        shopId,
        warrantyNumber,
        verificationToken,
        customerId: data.customerId,
        productId: data.productId,
        issuedById,
        status: 'ACTIVE',
        warrantyType,
        serialNumber: data.serialNumber || null,
        invoiceNumber: data.invoiceNumber || null,
        purchaseDate,
        warrantyStartDate: startDate,
        warrantyEndDate: endDate,
        warrantyMonths: months,
        terms: data.terms || product.warrantyTerms || null,
        exclusions: data.exclusions || product.warrantyExclusions || null,
        notes: data.notes || null,
        purchasePrice: data.purchasePrice ?? null,
        idempotencyKey: data.idempotencyKey ?? null,
        activatedAt: new Date(),
      },
      include: {
        customer: true,
        product: true,
        shop: true,
        issuedBy: { select: { id: true, name: true } },
      },
    })

    await tx.warrantyEvent.create({
      data: {
        warrantyId: warranty.id,
        toStatus: 'ACTIVE',
        actorId: issuedById,
        actorName,
        note: 'Warranty created and activated',
      },
    })

    await tx.auditLog.create({
      data: {
        shopId,
        actorId: issuedById,
        actorName,
        action: 'WARRANTY_CREATED',
        entityType: 'Warranty',
        entityId: warranty.id,
        metadata: { warrantyNumber: warranty.warrantyNumber },
      },
    })

    return warranty
  })
}

// ─────────────────────────────────────────
// Status Transition
// ─────────────────────────────────────────

export async function transitionWarrantyStatus(
  warrantyId: string,
  shopId: string,
  toStatus: WarrantyStatus,
  actorId: string,
  actorName: string,
  note?: string,
) {
  const warranty = await prisma.warranty.findFirst({
    where: { id: warrantyId, shopId },
  })
  if (!warranty) throw new Error('Warranty not found')
  if (!canTransition(warranty.status, toStatus)) {
    throw new Error(`Cannot transition from ${warranty.status} to ${toStatus}`)
  }

  const statusDates: Record<string, Date | null> = {}
  if (toStatus === 'EXPIRED') statusDates.expiredAt = new Date()
  if (toStatus === 'CANCELLED') statusDates.cancelledAt = new Date()
  if (toStatus === 'VOIDED') statusDates.voidedAt = new Date()

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.warranty.update({
      where: { id: warrantyId },
      data: { status: toStatus, ...statusDates },
    })

    await tx.warrantyEvent.create({
      data: {
        warrantyId,
        fromStatus: warranty.status,
        toStatus,
        actorId,
        actorName,
        note,
      },
    })

    await tx.auditLog.create({
      data: {
        shopId,
        actorId,
        actorName,
        action: 'WARRANTY_UPDATED',
        entityType: 'Warranty',
        entityId: warrantyId,
        metadata: { fromStatus: warranty.status, toStatus, note },
      },
    })

    return updated
  })
}

// ─────────────────────────────────────────
// Public Verification (PII masked)
// ─────────────────────────────────────────

export async function getWarrantyForVerification(token: string) {
  const warranty = await prisma.warranty.findFirst({
    where: { verificationToken: token },
    include: {
      product: {
        select: { name: true, brand: true, modelNumber: true, sku: true },
      },
      shop: {
        select: { name: true, phone: true, email: true, logoUrl: true, city: true },
      },
      customer: { select: { name: true, phone: true, email: true } },
    },
  })
  if (!warranty) return null

  const { customer, internalNotes: _internal, issuedById: _issuedBy, idempotencyKey: _idKey, ...rest } = warranty

  return {
    ...rest,
    customer: {
      name: customer.name,
      phone: customer.phone ? maskPhone(customer.phone) : null,
      email: customer.email ? maskEmail(customer.email) : null,
    },
    serialNumber: rest.serialNumber ? maskSerial(rest.serialNumber) : null,
  }
}
