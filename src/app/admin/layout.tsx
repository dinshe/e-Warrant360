import React from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Store, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || !(session.user as any).isPlatformAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Platform Admin Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
            PA
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              e-warrant360 Platform Administration
            </h2>
            <p className="text-[10px] text-amber-400 font-mono">SUPER-ADMIN ELEVATED CONTEXT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-300 border-slate-700 hover:bg-slate-800">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Seller Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
        {children}
      </main>
    </div>
  )
}
