import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateTenantSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !(session.user as any).isPlatformAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Platform admin only' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateTenantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: { status: parsed.data.status },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.name,
        action: parsed.data.status === 'SUSPENDED' ? 'SHOP_SUSPENDED' : 'SHOP_REACTIVATED',
        entityType: 'Shop',
        entityId: id,
        metadata: { status: parsed.data.status },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('[ADMIN_TENANT_UPDATE]', err)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}
