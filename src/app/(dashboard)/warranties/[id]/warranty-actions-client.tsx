'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Wrench,
  UserCheck,
  RefreshCw,
  Ban,
  Clock,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CustomerMini {
  id: string
  name: string
  phone?: string | null
}

interface WarrantyActionsClientProps {
  warrantyId: string
  currentStatus: string
  serialNumber?: string | null
  customers: CustomerMini[]
  shopId: string
}

export function WarrantyActionsClient({
  warrantyId,
  currentStatus,
  serialNumber,
  customers,
  shopId,
}: WarrantyActionsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'claim' | 'transfer' | 'replace' | 'status' | null>(null)
  const [loading, setLoading] = useState(false)

  // Claim Form State
  const [claimIssue, setClaimIssue] = useState('')
  const [claimNotes, setClaimNotes] = useState('')

  // Transfer Form State
  const [transferCustomerId, setTransferCustomerId] = useState('')
  const [transferNotes, setTransferNotes] = useState('')

  // Replacement Form State
  const [replacementSerial, setReplacementSerial] = useState('')
  const [replacementReason, setReplacementReason] = useState('')

  // Status Change State
  const [targetStatus, setTargetStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')

  // 1. Submit Claim
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimIssue.trim()) {
      toast.error('Please describe the reported issue')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warrantyId,
          reportedIssue: claimIssue.trim(),
          notes: claimNotes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to file claim')

      toast.success(`Claim filed successfully! (${data.data.claimNumber})`)
      setActiveTab(null)
      setClaimIssue('')
      setClaimNotes('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error creating claim')
    } finally {
      setLoading(false)
    }
  }

  // 2. Transfer Warranty
  const handleTransferWarranty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferCustomerId) {
      toast.error('Please select the new customer')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/warranties/${warrantyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSFER',
          newCustomerId: transferCustomerId,
          notes: transferNotes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to transfer warranty')

      toast.success('Warranty ownership successfully transferred!')
      setActiveTab(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error transferring warranty')
    } finally {
      setLoading(false)
    }
  }

  // 3. Product Replacement
  const handleReplaceProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replacementSerial.trim()) {
      toast.error('New replacement serial number is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/warranties/${warrantyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLACE',
          newSerialNumber: replacementSerial.trim(),
          notes: replacementReason.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record replacement')

      toast.success('Replacement recorded and warranty updated!')
      setActiveTab(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error processing replacement')
    } finally {
      setLoading(false)
    }
  }

  // 4. Update Status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStatus) {
      toast.error('Please select a target status')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/warranties/${warrantyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          status: targetStatus,
          note: statusReason.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      toast.success(`Warranty status updated to ${targetStatus}!`)
      setActiveTab(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error updating status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Warranty Operations & Service Actions</CardTitle>
        <CardDescription>
          Execute lifecycle actions: file service claims, transfer ownership, record unit replacement, or update status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Button
            size="sm"
            variant={activeTab === 'claim' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'claim' ? null : 'claim')}
            className="text-xs gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            File Claim / Service
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'transfer' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'transfer' ? null : 'transfer')}
            className="text-xs gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Transfer Warranty
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'replace' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'replace' ? null : 'replace')}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace Unit
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'status' ? 'default' : 'outline'}
            onClick={() => setActiveTab(activeTab === 'status' ? null : 'status')}
            className="text-xs gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            Change Status
          </Button>
        </div>

        {/* Tab 1: File Claim */}
        {activeTab === 'claim' && (
          <form onSubmit={handleCreateClaim} className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-purple-900 uppercase">
              Submit Service or Repair Claim
            </h4>
            <div>
              <Label className="text-xs">Reported Issue / Fault Description *</Label>
              <Textarea
                value={claimIssue}
                onChange={(e) => setClaimIssue(e.target.value)}
                placeholder="e.g. Device does not power on after power surge..."
                className="mt-1 bg-white text-xs"
                rows={2}
                required
              />
            </div>
            <div>
              <Label className="text-xs">Internal Notes</Label>
              <Input
                value={claimNotes}
                onChange={(e) => setClaimNotes(e.target.value)}
                placeholder="Optional inspection remarks..."
                className="mt-1 bg-white text-xs h-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setActiveTab(null)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="text-xs bg-purple-700 hover:bg-purple-800 text-white">
                {loading ? 'Submitting...' : 'Confirm Claim Submission'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Transfer Warranty */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransferWarranty} className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase">
              Transfer Ownership to Another Customer (Section 11)
            </h4>
            <p className="text-[11px] text-blue-800">
              Preserves original purchase date, duration, and warranty timeline while updating the legal holder.
            </p>
            <div>
              <Label className="text-xs">New Owner / Customer *</Label>
              <select
                value={transferCustomerId}
                onChange={(e) => setTransferCustomerId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">-- Choose Registered Customer ({customers.length}) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Transfer Authorization Reason / Notes</Label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="e.g. Resold with original receipt, approved by seller..."
                className="mt-1 bg-white text-xs h-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setActiveTab(null)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Transferring...' : 'Authorize Transfer'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Replace Product */}
        {activeTab === 'replace' && (
          <form onSubmit={handleReplaceProduct} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase">
              Product Replacement Event (Section 12)
            </h4>
            <p className="text-[11px] text-emerald-800">
              Records previous serial number ({serialNumber || 'N/A'}) and assigns replacement unit while updating audit log.
            </p>
            <div>
              <Label className="text-xs">New Replacement Unit Serial Number *</Label>
              <Input
                value={replacementSerial}
                onChange={(e) => setReplacementSerial(e.target.value)}
                placeholder="e.g. SN-SAM55-NEW-0091"
                className="mt-1 bg-white text-xs h-9 font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Replacement Reason / Inspection Notes</Label>
              <Input
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
                placeholder="e.g. Motherboard defect confirmed; full replacement authorized..."
                className="mt-1 bg-white text-xs h-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setActiveTab(null)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? 'Recording...' : 'Record Replacement'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 4: Change Status */}
        {activeTab === 'status' && (
          <form onSubmit={handleUpdateStatus} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Transition Warranty State (Current: {currentStatus})
            </h4>
            <div>
              <Label className="text-xs">New Lifecycle Status *</Label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">-- Select Status --</option>
                <option value="ACTIVE">ACTIVE (Re-activate)</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="VOIDED">VOIDED (Breach of terms)</option>
                <option value="CANCELLED">CANCELLED (Returned sale)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Reason / Justification</Label>
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for administrative state change..."
                className="mt-1 bg-white text-xs h-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setActiveTab(null)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="text-xs">
                {loading ? 'Saving...' : 'Update Status'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
