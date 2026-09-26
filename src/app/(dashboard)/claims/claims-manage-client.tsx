'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Wrench, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface ClaimItem {
  id: string
  claimNumber: string
  status: string
  reportedIssue: string
  inspectionNotes?: string | null
  repairNotes?: string | null
  rejectionReason?: string | null
  createdAt: string | Date
  warranty: {
    id: string
    warrantyNumber: string
    product: { name: string; modelNumber?: string | null }
    customer: { name: string; phone?: string | null }
  }
  handledBy?: { name: string } | null
}

export function ClaimsManageClient({ claims }: { claims: ClaimItem[] }) {
  const router = useRouter()
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null)
  const [targetStatus, setTargetStatus] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClaim || !targetStatus) return

    setLoading(true)
    try {
      const res = await fetch(`/api/claims/${selectedClaim.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          inspectionNotes: actionNotes,
          note: actionNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update claim')

      toast.success(`Claim ${selectedClaim.claimNumber} updated to ${targetStatus}!`)
      setSelectedClaim(null)
      setTargetStatus('')
      setActionNotes('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error updating claim')
    } finally {
      setLoading(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="warning">Submitted</Badge>
      case 'UNDER_REVIEW':
        return <Badge variant="purple">Under Review</Badge>
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>
      case 'UNDER_SERVICE':
        return <Badge variant="purple">Under Service</Badge>
      case 'REPAIRED':
        return <Badge variant="success">Repaired</Badge>
      case 'REPLACED':
        return <Badge variant="success">Replaced</Badge>
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Modal / Panel for updating claim */}
      {selectedClaim && (
        <Card className="border-2 border-purple-500/30 bg-purple-50/40 p-6 shadow-md">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Update Service Case: <span className="font-mono text-purple-700">{selectedClaim.claimNumber}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Item: {selectedClaim.warranty.product.name} • Customer: {selectedClaim.warranty.customer.name}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClaim(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Change Service Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                >
                  <option value="">-- Select New Status --</option>
                  <option value="UNDER_REVIEW">Under Review (Inspection)</option>
                  <option value="APPROVED">Approved for Repair/Service</option>
                  <option value="UNDER_SERVICE">Under Active Service / Repair</option>
                  <option value="REPAIRED">Repaired Successfully</option>
                  <option value="REPLACED">Unit Replaced</option>
                  <option value="COMPLETED">Service Completed & Returned</option>
                  <option value="REJECTED">Claim Rejected (Policy Exclusion)</option>
                  <option value="CLOSED">Case Closed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Technician / Inspection Notes
                </label>
                <input
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record diagnostic findings, replaced parts, or reason..."
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedClaim(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-purple-700 hover:bg-purple-800 text-white"
              >
                {loading ? 'Saving...' : 'Update Service Status'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          {claims.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No warranty claims recorded</p>
              <p className="text-xs text-gray-400 mt-1">
                To create a claim, navigate to any active warranty and click "File Claim / Service".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Claim Number</th>
                    <th className="px-5 py-3.5">Warranty No</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Reported Issue</th>
                    <th className="px-5 py-3.5">Date Filed</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-purple-700">
                        {c.claimNumber}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-blue-600">
                        <Link href={`/warranties/${c.warranty.id}`} className="hover:underline">
                          {c.warranty.warrantyNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{c.warranty.customer.name}</p>
                        <p className="text-xs text-gray-500">{c.warranty.customer.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-700 max-w-xs">
                        <p className="truncate font-medium">{c.reportedIssue}</p>
                        {c.inspectionNotes && (
                          <p className="text-gray-400 truncate text-[11px] mt-0.5">
                            Note: {c.inspectionNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        {renderStatusBadge(c.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClaim(c)
                            setTargetStatus(c.status)
                            setActionNotes(c.inspectionNotes || '')
                          }}
                          className="h-8 px-2.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
