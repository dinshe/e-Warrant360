import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { shopSchema } from '@/lib/validations'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  const role = (session.user as any).role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!['OWNER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        addressLine1: body.addressLine1 || null,
        city: body.city || null,
        district: body.district || null,
        province: body.province || null,
        businessRegNumber: body.businessRegNumber || null,
        defaultWarrantyMonths: Number(body.defaultWarrantyMonths || 12),
        warrantyPolicy: body.warrantyPolicy || null,
        notifyOnCreate: Boolean(body.notifyOnCreate),
        notifyOnExpiry: Boolean(body.notifyOnExpiry),
      },
    })

    await prisma.auditLog.create({
      data: {
        shopId,
        actorId: session.user.id,
        actorName: session.user.name,
        action: 'SETTINGS_UPDATED',
        entityType: 'Shop',
        entityId: shopId,
        metadata: { updatedFields: Object.keys(body) },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('[SHOP_SETTINGS_UPDATE]', err)
    return NextResponse.json({ error: 'Failed to update shop settings' }, { status: 500 })
  }
}
