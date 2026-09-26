'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CustomerEditClientProps {
  customer: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    addressLine1?: string | null
    city?: string | null
    district?: string | null
    notes?: string | null
  }
  canDelete: boolean
}

export function CustomerEditClient({
  customer,
  canDelete,
}: CustomerEditClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    addressLine1: customer.addressLine1 || '',
    city: customer.city || '',
    district: customer.district || '',
    notes: customer.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }

      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update customer')
      }

      toast.success('Customer details updated successfully!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error updating customer')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove customer')
      }

      toast.success('Customer profile archived')
      router.push('/customers')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting customer')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              All Customers
            </Button>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">{customer.name}</span>
        </div>

        {canDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Archive Customer
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-red-900">
                Confirm Customer Archival
              </h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Archiving this customer hides them from future autocomplete suggestions. Existing warranties
                and service records will maintain full integrity and reference history.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="text-xs h-8"
                >
                  {deleting ? 'Archiving...' : 'Confirm Archival'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Customer Contact Information
            </CardTitle>
            <CardDescription>
              Legal warranty holder information used on certificates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Customer Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number (Sri Lanka)</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0771234567 or +9477..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="customer@domain.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="addressLine1">Address / Street</Label>
                <Input
                  id="addressLine1"
                  value={form.addressLine1}
                  onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                  placeholder="e.g. 15/3 Kandy Road"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city">City / Town</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Kurunegala"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Seller Notes (Internal)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Private remarks (e.g. VIP client, preferred service contact)..."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/customers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {loading ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Save Profile</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
