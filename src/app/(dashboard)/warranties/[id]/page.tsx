import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Printer,
  History,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Wrench,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { WarrantyStatusBadge } from '@/components/warranties/warranty-status-badge'
import { WarrantyCertificate } from '@/components/warranties/warranty-certificate'
import { WarrantyQr } from '@/components/warranties/warranty-qr'
import { formatDate } from '@/lib/utils'
import { WarrantyActionsClient } from './warranty-actions-client'

export default async function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId
  const { id } = await params

  if (!shopId) notFound()

  // Always enforce tenant isolation at database query level
  const warranty = await prisma.warranty.findFirst({
    where: { id, shopId },
    include: {
      customer: true,
      product: true,
      shop: true,
      issuedBy: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: 'desc' } },
      claims: {
        include: { handledBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      transfers: { orderBy: { createdAt: 'desc' } },
      replacedBy: { select: { id: true, warrantyNumber: true, serialNumber: true } },
      replaces: { select: { id: true, warrantyNumber: true, serialNumber: true } },
    },
  })

  if (!warranty) {
    notFound()
  }

  // Also fetch customer list for potential warranty transfer
  const customers = await prisma.customer.findMany({
    where: { shopId, deletedAt: null, id: { not: warranty.customerId } },
    select: { id: true, name: true, phone: true },
    take: 50,
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/warranties">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              All Warranties
            </Button>
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <span className="font-mono text-sm font-bold text-gray-700">
            {warranty.warrantyNumber}
          </span>
          <WarrantyStatusBadge status={warranty.status} />
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/verify/${warranty.verificationToken}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              Public Verification Link
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Certificate & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certificate Display */}
        <div className="lg:col-span-2 space-y-8">
          <WarrantyCertificate warranty={warranty as any} />

          {/* Interactive Management Actions (Lifecycle, Claims, Transfer, Replacement) */}
          <WarrantyActionsClient
            warrantyId={warranty.id}
            currentStatus={warranty.status}
            serialNumber={warranty.serialNumber}
            customers={customers}
            shopId={shopId}
          />

          {/* Event History / Audit Trail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Lifecycle Audit Timeline
              </CardTitle>
              <CardDescription>
                Immutable record of every status transition, claim, and administrative action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {warranty.events.length === 0 ? (
                <p className="text-xs text-gray-500 py-3">No recorded events yet</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-2">
                  {warranty.events.map((ev) => (
                    <div key={ev.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {ev.fromStatus ? `${ev.fromStatus} → ` : ''}
                          <span className="text-blue-700">{ev.toStatus}</span>
                        </span>
                        <span className="text-slate-400">{formatDate(ev.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {ev.note || 'State updated'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Action by: {ev.actorName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar details & QR Code */}
        <div className="space-y-6">
          {/* Quick QR Card */}
          <Card>
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-sm">Scan to Verify</CardTitle>
              <CardDescription className="text-xs">
                Give this QR to the customer
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-4">
              <WarrantyQr
                url={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${warranty.verificationToken}`}
                warrantyNumber={warranty.warrantyNumber}
                size={160}
              />
            </CardContent>
          </Card>

          {/* Quick Info Box */}
          <Card className="text-xs space-y-3 p-5 text-slate-600">
            <h4 className="font-bold text-slate-900 text-sm border-b pb-2">
              Issuance Details
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-400">Issuing Staff:</span>
              <span className="font-medium text-slate-800">{warranty.issuedBy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Created At:</span>
              <span className="font-medium text-slate-800">{formatDate(warranty.createdAt)}</span>
            </div>
            {warranty.internalNotes && (
              <div className="pt-2 border-t">
                <span className="text-slate-400 block mb-1">Private Notes:</span>
                <p className="bg-slate-50 p-2 rounded text-slate-700 font-mono text-[11px]">
                  {warranty.internalNotes}
                </p>
              </div>
            )}
          </Card>

          {/* Existing Claims associated with this warranty */}
          {warranty.claims.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  Service Claims ({warranty.claims.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {warranty.claims.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between font-mono font-bold text-purple-700">
                      <span>{c.claimNumber}</span>
                      <span className="text-slate-500 font-sans text-[11px] font-normal">{c.status}</span>
                    </div>
                    <p className="mt-1 text-slate-700 truncate">{c.reportedIssue}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
