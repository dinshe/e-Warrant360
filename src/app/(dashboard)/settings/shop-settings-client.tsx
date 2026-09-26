'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Store, MapPin, Shield, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ShopSettingsProps {
  shop: {
    id: string
    name: string
    email: string
    phone?: string | null
    website?: string | null
    addressLine1?: string | null
    city?: string | null
    district?: string | null
    province?: string | null
    businessRegNumber?: string | null
    currency: string
    timezone: string
    defaultWarrantyMonths: number
    warrantyPolicy?: string | null
    notifyOnCreate: boolean
    notifyOnExpiry: boolean
  }
}

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

export function ShopSettingsClient({ shop }: ShopSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: shop.name || '',
    email: shop.email || '',
    phone: shop.phone || '',
    website: shop.website || '',
    addressLine1: shop.addressLine1 || '',
    city: shop.city || '',
    district: shop.district || 'Colombo',
    province: shop.province || 'WESTERN',
    businessRegNumber: shop.businessRegNumber || '',
    currency: shop.currency || 'LKR',
    timezone: shop.timezone || 'Asia/Colombo',
    defaultWarrantyMonths: shop.defaultWarrantyMonths || 12,
    warrantyPolicy: shop.warrantyPolicy || '',
    notifyOnCreate: shop.notifyOnCreate ?? true,
    notifyOnExpiry: shop.notifyOnExpiry ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')

      toast.success('Shop settings updated successfully!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error updating settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            Shop Information & Official Identity
          </CardTitle>
          <CardDescription>Branding displayed on digital certificates and customer verification pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shopName" className="text-xs">Shop Name *</Label>
              <Input
                id="shopName"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="businessRegNumber" className="text-xs">Business Registration (BR) Number</Label>
              <Input
                id="businessRegNumber"
                value={form.businessRegNumber}
                onChange={(e) => setForm((f) => ({ ...f, businessRegNumber: e.target.value }))}
                placeholder="e.g. PV-123456 / W-88941"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="shopEmail" className="text-xs">Public Contact Email *</Label>
              <Input
                id="shopEmail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="shopPhone" className="text-xs">Customer Support Phone (Sri Lanka)</Label>
              <Input
                id="shopPhone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0112345678 or 0771234567"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sri Lanka Location Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Sri Lankan Location & Regional Settings
          </CardTitle>
          <CardDescription>Localized address and operating currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="addressLine1" className="text-xs">Street Address</Label>
              <Input
                id="addressLine1"
                value={form.addressLine1}
                onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                placeholder="e.g. 142 Galle Road"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="city" className="text-xs">City / Town</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Colombo 03"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="district" className="text-xs">District</Label>
              <select
                id="district"
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="currency" className="text-xs">Operating Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                disabled
                className="mt-1 bg-gray-100 text-gray-700 font-semibold"
              />
              <span className="text-[10px] text-gray-400">Fixed to Sri Lankan Rupee (LKR)</span>
            </div>

            <div>
              <Label htmlFor="timezone" className="text-xs">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                disabled
                className="mt-1 bg-gray-100 text-gray-700 font-mono text-xs"
              />
              <span className="text-[10px] text-gray-400">Asia/Colombo (UTC+05:30)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warranty Policy Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Warranty Policy Defaults
          </CardTitle>
          <CardDescription>Default terms applied across shop products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultWarrantyMonths" className="text-xs">Default Warranty Duration (Months)</Label>
            <Input
              id="defaultWarrantyMonths"
              type="number"
              min="1"
              max="600"
              value={form.defaultWarrantyMonths}
              onChange={(e) => setForm((f) => ({ ...f, defaultWarrantyMonths: Number(e.target.value) }))}
              className="mt-1 w-32"
            />
          </div>

          <div>
            <Label htmlFor="warrantyPolicy" className="text-xs">Standard Shop Warranty Policy Text</Label>
            <Textarea
              id="warrantyPolicy"
              value={form.warrantyPolicy}
              onChange={(e) => setForm((f) => ({ ...f, warrantyPolicy: e.target.value }))}
              placeholder="Provide general shop warranty terms, customer guidelines, and service hours..."
              rows={3}
              className="mt-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[160px]"
        >
          {loading ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Save Shop Settings</>}
        </Button>
      </div>
    </form>
  )
}
