import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { POSIntegrationService } from '@/lib/integrations/pos'
import { z } from 'zod'
import { createHash } from 'crypto'

const webhookSchema = z.object({
  shopSlug: z.string().min(1),
  apiKey: z.string().min(1),
  transactionId: z.string().min(1),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  invoiceNumber: z.string().optional(),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
  item: z.object({
    productName: z.string().min(1),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    serialNumber: z.string().optional(),
    unitPrice: z.number().optional(),
    warrantyMonthsOverride: z.number().optional(),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = webhookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { shopSlug, apiKey, transactionId, saleDate, invoiceNumber, customer, item } =
      parsed.data

    // Authenticate shop tenant
    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
    })

    if (!shop || shop.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Shop not found or inactive' }, { status: 404 })
    }

    // Authenticate API key against tenant's registered active keys
    const hashedKey = createHash('sha256').update(apiKey.trim()).digest('hex')
    const activeKey = await prisma.apiKey.findFirst({
      where: {
        shopId: shop.id,
        keyHash: hashedKey,
        isActive: true,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    if (!activeKey) {
      return NextResponse.json({ error: 'Invalid, expired, or revoked API key' }, { status: 401 })
    }

    // Record last used time
    await prisma.apiKey
      .update({
        where: { id: activeKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {})

    // Call POS Integration Service
    const result = await POSIntegrationService.processSale({
      shopId: shop.id,
      posTransactionId: transactionId,
      saleDate,
      invoiceNumber,
      customer,
      item,
      idempotencyKey: `pos-hook:${transactionId}`,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Warranty created successfully via POS integration',
        data: result,
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('[POS_WEBHOOK]', err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
