import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const number = searchParams.get('number')?.trim().toUpperCase()

  if (!number || number.length < 5) {
    return NextResponse.json({ error: 'Valid warranty number required' }, { status: 400 })
  }

  // Rate limiting check
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const key = `lookup:${ip}`
  const now = new Date()

  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } })
  if (entry && entry.resetAt < now) {
    // Window expired, reset count
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: 1, resetAt: new Date(now.getTime() + 60 * 1000) },
    })
  } else if (entry) {
    if (entry.count >= 25) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please wait a moment.' },
        { status: 429 },
      )
    }
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
  } else {
    await prisma.rateLimitEntry.create({
      data: { key, count: 1, resetAt: new Date(now.getTime() + 60 * 1000) },
    })
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
