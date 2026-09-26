import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const number = searchParams.get('number')?.trim().toUpperCase()

  if (!number || number.length < 5) {
    return NextResponse.json({ error: 'Valid warranty number required' }, { status: 400 })
  }

  // Rate limiting check
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `lookup:${ip}`
  const now = new Date()

  const entry = await prisma.rateLimitEntry.upsert({
    where: { key },
    update: { count: { increment: 1 }, updatedAt: now },
    create: { key, count: 1, resetAt: new Date(now.getTime() + 60 * 1000) },
  })

  if (entry.count > 25) {
    return NextResponse.json({ error: 'Too many verification requests. Please wait a moment.' }, { status: 429 })
  }

  const warranty = await prisma.warranty.findUnique({
    where: { warrantyNumber: number },
    select: { verificationToken: true },
  })

  if (!warranty) {
    return NextResponse.json({ error: 'No matching warranty record found' }, { status: 404 })
  }

  return NextResponse.json({ token: warranty.verificationToken })
}
