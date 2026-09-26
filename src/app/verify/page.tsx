'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Search, QrCode, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function PublicVerifyPage() {
  const router = useRouter()
  const [warrantyNumber, setWarrantyNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNumber = warrantyNumber.trim().toUpperCase()

    if (!cleanNumber) {
      toast.error('Please enter a warranty number')
      return
    }

    setLoading(true)
    try {
      // Lookup verification token by warranty number
      const res = await fetch(`/api/verify/lookup?number=${encodeURIComponent(cleanNumber)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Warranty not found')
      }

      router.push(`/verify/${data.token}`)
    } catch (err: any) {
      toast.error(err.message || 'Warranty record not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white shadow-sm">
            EW
          </div>
          <span className="font-bold text-white text-lg tracking-tight">e-warrant360</span>
        </Link>

        <Link href="/login" className="text-sm text-blue-200 hover:text-white transition">
          Seller Login
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-xl mx-auto w-full text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-400/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Verify Product Warranty
        </h1>
        <p className="text-sm text-slate-300 mt-2 mb-8 max-w-md">
          Enter your official warranty certificate number or scan the QR code to verify coverage status, expiry date, and authenticity.
        </p>

        {/* Verification Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-8 rounded-2xl w-full shadow-2xl text-left">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-200 block mb-1.5">
                Warranty Identification Number
              </label>
              <div className="relative">
                <Input
                  value={warrantyNumber}
                  onChange={(e) => setWarrantyNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. EW360-7F4K92"
                  className="bg-white/90 text-slate-900 placeholder:text-slate-400 font-mono text-base uppercase tracking-wider h-12"
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5">
                Located on your digital warranty certificate or SMS/email confirmation.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg gap-2"
            >
              {loading ? (
                'Checking Registry...'
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Warranty Status
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-300 space-y-2">
            <p className="flex items-center justify-center gap-1.5 font-medium text-slate-200">
              <QrCode className="w-4 h-4 text-blue-400" />
              Have a printed or digital QR code?
            </p>
            <p className="text-[11px] text-slate-400">
              Simply scan it directly using your smartphone camera to view the live verification status.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          e-warrant360 • Trusted by Sri Lankan SMB Retailers 🇱🇰
        </p>
      </div>
    </div>
  )
}
