import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'
import { z } from 'zod'

const createKeySchema = z.object({
  name: z.string().min(2).max(100).trim(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  const role = (session.user as any).role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!['OWNER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { shopId, revokedAt: null },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: keys })
}

export async function POST(req: NextRequest) {
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
    const parsed = createKeySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid key name', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    // Generate cryptographic secret key
    const rawSecret = randomBytes(24).toString('hex')
    const fullKey = `ew_live_${rawSecret}`
    const prefix = `ew_live_${rawSecret.slice(0, 6)}...`
    const keyHash = createHash('sha256').update(fullKey).digest('hex')

    const newKey = await prisma.apiKey.create({
      data: {
        shopId,
        name: parsed.data.name,
        prefix,
        keyHash,
        permissions: ['pos:write', 'warranty:create'],
        createdById: session.user.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        shopId,
        actorId: session.user.id,
        actorName: session.user.name,
        action: 'API_KEY_CREATED',
        entityType: 'ApiKey',
        entityId: newKey.id,
        metadata: { name: newKey.name, prefix: newKey.prefix },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newKey.id,
          name: newKey.name,
          prefix: newKey.prefix,
          apiKey: fullKey, // Return plaintext ONCE
          createdAt: newKey.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('[API_KEY_CREATE_ERROR]', err)
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  const role = (session.user as any).role
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })
  if (!['OWNER', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const keyId = searchParams.get('id')
  if (!keyId) return NextResponse.json({ error: 'API key ID required' }, { status: 400 })

  const existing = await prisma.apiKey.findFirst({
    where: { id: keyId, shopId },
  })
  if (!existing) return NextResponse.json({ error: 'API key not found' }, { status: 404 })

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false, revokedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      shopId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'API_KEY_REVOKED',
      entityType: 'ApiKey',
      entityId: keyId,
      metadata: { prefix: existing.prefix },
    },
  })

  return NextResponse.json({ success: true, message: 'API key revoked' })
}
