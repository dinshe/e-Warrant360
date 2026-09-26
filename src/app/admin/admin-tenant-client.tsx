'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface AdminTenantClientProps {
  shopId: string
  currentStatus: string
  shopName: string
}

export function AdminTenantClient({
  shopId,
  currentStatus,
  shopName,
}: AdminTenantClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggleStatus = async () => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const confirmMsg =
      currentStatus === 'ACTIVE'
        ? `Are you sure you want to suspend "${shopName}"? Their staff will lose dashboard access.`
        : `Re-activate tenant "${shopName}"?`

    if (!confirm(confirmMsg)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update tenant status')

      toast.success(`Tenant ${shopName} is now ${nextStatus}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error updating tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={toggleStatus}
      disabled={loading}
      className={`h-7 px-2.5 text-xs border-slate-600 ${
        currentStatus === 'ACTIVE'
          ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40'
          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
      }`}
    >
      {loading
        ? 'Updating...'
        : currentStatus === 'ACTIVE'
        ? 'Suspend'
        : 'Reactivate'}
    </Button>
  )
}
