import { NextRequest, NextResponse } from 'next/server'
import { getWarrantyForVerification } from '@/lib/services/warranty.service'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  // Rate limiting via DB
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const key = `verify:${ip}`
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 30

  const now = new Date()

  const rateLimit = await prisma.rateLimitEntry.upsert({
    where: { key },
    update: {
      count: { increment: 1 },
      updatedAt: now,
    },
    create: {
      key,
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
    },
  })

  // Reset if window expired
  if (rateLimit.resetAt < now) {
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
    })
  } else if (rateLimit.count > maxRequests) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  try {
    const warranty = await getWarrantyForVerification(token)
    if (!warranty) {
      return NextResponse.json({ error: 'Warranty not found' }, { status: 404 })
    }

    await prisma.auditLog
      .create({
        data: {
          action: 'WARRANTY_VERIFIED',
          entityType: 'Warranty',
          entityId: warranty.id,
          ipAddress: ip,
          metadata: { warrantyNumber: warranty.warrantyNumber },
        },
      })
      .catch(() => {})

    return NextResponse.json({ data: warranty })
  } catch (err) {
    console.error('[VERIFY]', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
