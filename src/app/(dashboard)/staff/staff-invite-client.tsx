'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function StaffInviteClient({ shopId }: { shopId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      toast.error('All fields are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add staff member')

      toast.success('Staff account created and added to shop!')
      setOpen(false)
      setName('')
      setEmail('')
      setPassword('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error creating staff')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        <UserPlus className="w-4 h-4" />
        Add Staff Member
      </Button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Add New Staff Member
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
                Cancel
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="staffName" className="text-xs">Full Name *</Label>
                <Input
                  id="staffName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunil Fernando"
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="staffEmail" className="text-xs">Email Address *</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sunil@shop.lk"
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="staffPassword" className="text-xs">Initial Password * (min 8 chars)</Label>
                <Input
                  id="staffPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 h-9 text-xs"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <Label htmlFor="staffRole" className="text-xs">Staff Role *</Label>
                <select
                  id="staffRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-1 flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="STAFF">Staff (Can issue warranties & handle claims)</option>
                  <option value="ADMIN">Shop Admin (Can manage products & staff)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
