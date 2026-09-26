'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function QuickVerifyForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!clean) return

    setLoading(true)
    try {
      const res = await fetch(`/api/verify/lookup?number=${encodeURIComponent(clean)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Warranty number not found')
      }

      router.push(`/verify/${data.token}`)
    } catch (err: any) {
      toast.error(err.message || 'Warranty record not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleLookup}
      className="w-full max-w-md mx-auto flex items-center bg-white/10 backdrop-blur-md border border-blue-400/30 rounded-xl p-1.5 shadow-lg focus-within:border-blue-400 transition"
    >
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="e.g. EW360-7F4K92"
        className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-blue-300/70 font-mono focus:outline-none uppercase"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
        Verify
      </button>
    </form>
  )
}
