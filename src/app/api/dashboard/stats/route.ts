import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = session.user.shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [
    totalWarranties,
    activeWarranties,
    expiringSoon,
    openClaims,
    totalProducts,
    totalCustomers,
    recentWarranties,
  ] = await Promise.all([
    prisma.warranty.count({ where: { shopId } }),
    prisma.warranty.count({ where: { shopId, status: 'ACTIVE' } }),
    prisma.warranty.count({
      where: {
        shopId,
        status: 'ACTIVE',
        warrantyEndDate: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
    prisma.warrantyClaim.count({
      where: {
        shopId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'UNDER_SERVICE'] },
      },
    }),
    prisma.product.count({ where: { shopId, deletedAt: null, isActive: true } }),
    prisma.customer.count({ where: { shopId, deletedAt: null } }),
    prisma.warranty.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { name: true } },
        product: { select: { name: true, brand: true } },
      },
    }),
  ])

  return NextResponse.json({
    data: {
      totalWarranties,
      activeWarranties,
      expiringSoon,
      openClaims,
      totalProducts,
      totalCustomers,
      recentWarranties,
    },
  })
}
