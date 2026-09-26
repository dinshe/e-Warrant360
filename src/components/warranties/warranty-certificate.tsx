'use client'

import React from 'react'
import QRCode from 'react-qr-code'
import { WarrantyStatusBadge } from './warranty-status-badge'
import { formatDate, formatLKR } from '@/lib/utils'
import { Printer, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WarrantyCertificateProps {
  warranty: {
    id: string
    warrantyNumber: string
    verificationToken: string
    status: string
    serialNumber?: string | null
    invoiceNumber?: string | null
    purchaseDate: Date | string
    warrantyStartDate: Date | string
    warrantyEndDate: Date | string
    warrantyMonths: number
    warrantyType: string
    terms?: string | null
    exclusions?: string | null
    purchasePrice?: number | string | null
    product: {
      name: string
      brand?: string | null
      modelNumber?: string | null
      sku?: string | null
    }
    customer: {
      name: string
      phone?: string | null
      email?: string | null
      city?: string | null
    }
    shop: {
      name: string
      phone?: string | null
      email?: string | null
      addressLine1?: string | null
      city?: string | null
      district?: string | null
      logoUrl?: string | null
      businessRegNumber?: string | null
    }
  }
  publicVerificationUrl?: string
}

export function WarrantyCertificate({ warranty, publicVerificationUrl }: WarrantyCertificateProps) {
  const verifyUrl =
    publicVerificationUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${warranty.verificationToken}`
      : `/verify/${warranty.verificationToken}`)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Print action header */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Official Certificate Container */}
      <div className="relative bg-white border-2 border-blue-900/20 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Top Watermark / Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-semibold tracking-widest uppercase text-blue-300">
                Official Digital Certificate
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {warranty.shop.name}
            </h1>
            <p className="text-sm text-blue-200 mt-1">
              {warranty.shop.city ? `${warranty.shop.city}, ` : ''}
              {warranty.shop.district || 'Sri Lanka'}
              {warranty.shop.businessRegNumber ? ` • BR: ${warranty.shop.businessRegNumber}` : ''}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs text-blue-300 font-mono">WARRANTY NO</span>
            <span className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-white">
              {warranty.warrantyNumber}
            </span>
            <div className="mt-2">
              <WarrantyStatusBadge status={warranty.status} />
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Product & Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Product Details
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {warranty.product.name}
              </h2>
              <div className="text-sm text-slate-600 mt-2 space-y-1">
                {warranty.product.brand && (
                  <p><span className="text-slate-400">Brand:</span> {warranty.product.brand}</p>
                )}
                {warranty.product.modelNumber && (
                  <p><span className="text-slate-400">Model:</span> {warranty.product.modelNumber}</p>
                )}
                {warranty.serialNumber && (
                  <p className="font-mono text-slate-800">
                    <span className="text-slate-400">Serial No:</span> {warranty.serialNumber}
                  </p>
                )}
                {warranty.invoiceNumber && (
                  <p><span className="text-slate-400">Invoice Ref:</span> {warranty.invoiceNumber}</p>
                )}
                {warranty.purchasePrice && (
                  <p><span className="text-slate-400">Price:</span> {formatLKR(Number(warranty.purchasePrice))}</p>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer & Holder
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {warranty.customer.name}
              </h2>
              <div className="text-sm text-slate-600 mt-2 space-y-1">
                {warranty.customer.phone && (
                  <p><span className="text-slate-400">Phone:</span> {warranty.customer.phone}</p>
                )}
                {warranty.customer.email && (
                  <p><span className="text-slate-400">Email:</span> {warranty.customer.email}</p>
                )}
                {warranty.customer.city && (
                  <p><span className="text-slate-400">Location:</span> {warranty.customer.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline & Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <p className="text-xs text-slate-500 uppercase">Purchase Date</p>
              <p className="font-semibold text-slate-800 mt-1 text-sm">{formatDate(warranty.purchaseDate)}</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <p className="text-xs text-slate-500 uppercase">Coverage Period</p>
              <p className="font-semibold text-slate-800 mt-1 text-sm">{warranty.warrantyMonths} Months</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <p className="text-xs text-slate-500 uppercase">Start Date</p>
              <p className="font-semibold text-slate-800 mt-1 text-sm">{formatDate(warranty.warrantyStartDate)}</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-xs">
              <p className="text-xs text-blue-700 font-semibold uppercase">Valid Until</p>
              <p className="font-bold text-blue-900 mt-1 text-sm">{formatDate(warranty.warrantyEndDate)}</p>
            </div>
          </div>

          {/* Terms & Exclusions */}
          <div className="space-y-4 text-xs text-slate-600">
            {warranty.terms && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Warranty Terms & Conditions</h4>
                <p className="whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {warranty.terms}
                </p>
              </div>
            )}
            {warranty.exclusions && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Exclusions & Limitations</h4>
                <p className="whitespace-pre-line leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200/60 text-amber-900">
                  {warranty.exclusions}
                </p>
              </div>
            )}
          </div>

          {/* Verification Footer with QR Code */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-xs">
                <QRCode value={verifyUrl} size={90} level="M" />
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                  Cryptographically Verifiable Record
                </p>
                <p>Scan with any phone camera to verify authenticity.</p>
                <p className="font-mono text-slate-600 text-[11px] truncate max-w-xs">{verifyUrl}</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">{warranty.shop.name}</p>
              {warranty.shop.phone && <p>Tel: {warranty.shop.phone}</p>}
              {warranty.shop.email && <p>Email: {warranty.shop.email}</p>}
              <p className="text-[10px] text-slate-400 mt-1">Powered by e-warrant360</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
