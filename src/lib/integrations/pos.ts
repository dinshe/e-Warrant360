/**
 * e-warrant360 POS & External Integration Engine
 *
 * Designed according to Specification Section 16:
 * Provides a clean adapter layer for receiving sales events from POS systems,
 * e-commerce stores (WooCommerce, Shopify), or ERPs, and automatically
 * routing them into the core warranty creation engine.
 */

import { prisma } from '@/lib/db'
import { createWarranty } from '@/lib/services/warranty.service'

export interface POSSalePayload {
  shopId: string
  posTransactionId: string
  saleDate: string
  invoiceNumber?: string
  customer: {
    name: string
    phone?: string
    email?: string
    address?: string
  }
  item: {
    sku?: string
    barcode?: string
    productName: string
    serialNumber?: string
    unitPrice?: number
    warrantyMonthsOverride?: number
  }
  idempotencyKey?: string
}

export interface POSIntegrationResult {
  success: boolean
  warrantyNumber?: string
  verificationUrl?: string
  customerId?: string
  productId?: string
  error?: string
}

export class POSIntegrationService {
  /**
   * Process a sale event from an external POS system.
   * Finds or creates the customer and product, then issues the digital warranty.
   */
  static async processSale(payload: POSSalePayload): Promise<POSIntegrationResult> {
    try {
      const { shopId, customer: custData, item, saleDate, invoiceNumber } = payload

      // 1. Idempotency Check: Don't create duplicate warranties for the same POS transaction
      if (payload.idempotencyKey) {
        const existing = await prisma.warranty.findUnique({
          where: { idempotencyKey: payload.idempotencyKey },
          select: { warrantyNumber: true, verificationToken: true },
        })
        if (existing) {
          return {
            success: true,
            warrantyNumber: existing.warrantyNumber,
            verificationUrl: `/verify/${existing.verificationToken}`,
          }
        }
      }

      // 2. Resolve or Create Customer (tenant-scoped)
      let customer = await prisma.customer.findFirst({
        where: {
          shopId,
          deletedAt: null,
          OR: [
            ...(custData.phone ? [{ phone: custData.phone }] : []),
            ...(custData.email ? [{ email: custData.email }] : []),
          ],
        },
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            shopId,
            name: custData.name,
            phone: custData.phone || null,
            email: custData.email || null,
            addressLine1: custData.address || null,
          },
        })
      }

      // 3. Resolve Product by SKU, Barcode, or Name (tenant-scoped)
      let product = await prisma.product.findFirst({
        where: {
          shopId,
          deletedAt: null,
          OR: [
            ...(item.sku ? [{ sku: item.sku }] : []),
            ...(item.barcode ? [{ barcode: item.barcode }] : []),
            { name: { equals: item.productName, mode: 'insensitive' } },
          ],
        },
      })

      if (!product) {
        // Automatically register product in catalogue if unknown from POS
        product = await prisma.product.create({
          data: {
            shopId,
            name: item.productName,
            sku: item.sku || null,
            barcode: item.barcode || null,
            defaultWarrantyMonths: item.warrantyMonthsOverride || 12,
            sellingPrice: item.unitPrice ? (item.unitPrice as any) : null,
            requiresSerialNumber: !!item.serialNumber,
          },
        })
      }

      // 4. Resolve Shop Owner or Admin as Issuer
      const shopOwner = await prisma.shopUser.findFirst({
        where: { shopId, role: 'OWNER' },
        include: { user: true },
      })

      if (!shopOwner) {
        throw new Error('Shop owner record not found')
      }

      // 5. Invoke Core Warranty Engine
      const warranty = await createWarranty({
        shopId,
        customerId: customer.id,
        productId: product.id,
        issuedById: shopOwner.userId,
        actorName: 'POS Automated Connector',
        serialNumber: item.serialNumber || undefined,
        invoiceNumber: invoiceNumber || payload.posTransactionId,
        purchaseDate: saleDate,
        warrantyMonths: item.warrantyMonthsOverride || product.defaultWarrantyMonths,
        purchasePrice: item.unitPrice,
        idempotencyKey: payload.idempotencyKey || `pos:${payload.posTransactionId}`,
        terms: product.warrantyTerms || undefined,
        exclusions: product.warrantyExclusions || undefined,
      })

      return {
        success: true,
        warrantyNumber: warranty.warrantyNumber,
        verificationUrl: `/verify/${warranty.verificationToken}`,
        customerId: customer.id,
        productId: product.id,
      }
    } catch (err: any) {
      console.error('[POS_INTEGRATION_ERROR]', err)
      return {
        success: false,
        error: err.message || 'Failed to process POS sale event',
      }
    }
  }
}
