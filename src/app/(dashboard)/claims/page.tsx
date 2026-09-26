import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Wrench, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ClaimsManageClient } from './claims-manage-client'

export default async function ClaimsPage() {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId

  const claims = await prisma.warrantyClaim.findMany({
    where: { shopId },
    include: {
      warranty: {
        include: {
          product: { select: { name: true, modelNumber: true } },
          customer: { select: { name: true, phone: true } },
        },
      },
      handledBy: { select: { name: true } },
      events: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Warranty Claims & Service Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Process inspection, repair, replacement, and customer service requests
          </p>
        </div>

        <Link href="/warranties">
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Wrench className="w-4 h-4" />
            File Claim from Warranty
          </Button>
        </Link>
      </div>

      {/* Claims List with Interactive Status Updates */}
      <ClaimsManageClient claims={claims as any} />
    </div>
  )
}
