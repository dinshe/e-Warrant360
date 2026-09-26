import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWarrantyForVerification } from '@/lib/services/warranty.service'
import { WarrantyCertificate } from '@/components/warranties/warranty-certificate'
import { ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PublicVerificationTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token || token.length < 20) {
    notFound()
  }

  const warranty = await getWarrantyForVerification(token)

  if (!warranty) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4 text-red-400">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Invalid or Expired Verification Link</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          This warranty record could not be found or the verification token is invalid.
        </p>
        <Link href="/verify" className="mt-6">
          <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
            Search by Warranty Number
          </Button>
        </Link>
      </div>
    )
  }

  const isExpired = new Date(warranty.warrantyEndDate) < new Date()
  const isValidActive = warranty.status === 'ACTIVE' && !isExpired

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col py-8 px-4">
      {/* Top Banner */}
      <div className="max-w-3xl mx-auto w-full mb-6 flex items-center justify-between">
        <Link href="/verify">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600">
            <ArrowLeft className="w-3.5 h-3.5" />
            Verify Another Product
          </Button>
        </Link>

        <div className="flex items-center gap-1.5">
          {isValidActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              AUTHENTIC & ACTIVE COVERAGE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              STATUS: {warranty.status} {isExpired ? '(EXPIRED)' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Main Certificate */}
      <div className="max-w-3xl mx-auto w-full">
        <WarrantyCertificate warranty={warranty as any} />
      </div>

      {/* Verification Integrity Note */}
      <footer className="max-w-3xl mx-auto w-full mt-8 text-center text-xs text-slate-400">
        <p>
          Verified via e-warrant360 Cryptographic Registry • Registered Seller:{' '}
          <strong className="text-slate-600">{warranty.shop.name}</strong>
        </p>
      </footer>
    </div>
  )
}
