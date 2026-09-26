'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Store,
  MapPin,
  Shield,
  CheckCircle2,
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  Terminal,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ApiKeyItem {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
  isActive: boolean
}

interface ShopSettingsProps {
  shop: {
    id: string
    name: string
    slug?: string
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

  // API Key management state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [appOrigin, setAppOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin)
    }
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const res = await fetch('/api/shop/api-keys')
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.data || [])
      }
    } catch {
      // Ignored if unauthenticated
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the key')
      return
    }

    setCreatingKey(true)
    try {
      const res = await fetch('/api/shop/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate key')

      setJustCreatedKey(data.data.apiKey)
      setNewKeyName('')
      toast.success('API key generated! Copy it now as it will not be shown again.')
      loadApiKeys()
    } catch (err: any) {
      toast.error(err.message || 'Error generating API key')
    } finally {
      setCreatingKey(false)
    }
  }

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Connected POS terminals will lose access.')) {
      return
    }

    try {
      const res = await fetch(`/api/shop/api-keys?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke key')
      toast.success('API key revoked')
      loadApiKeys()
    } catch (err: any) {
      toast.error(err.message || 'Error revoking key')
    }
  }

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

  const webhookEndpoint = `${appOrigin || 'https://ewarrant360.lk'}/api/integrations/pos/webhook`
  const sampleCurl = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "shopSlug": "${shop.slug || 'my-shop'}",
    "apiKey": "${justCreatedKey || 'ew_live_your_api_key_here'}",
    "transactionId": "TXN-98412",
    "saleDate": "${new Date().toISOString().split('T')[0]}",
    "invoiceNumber": "INV-2024-001",
    "customer": {
      "name": "Kamal Silva",
      "phone": "0771234567",
      "email": "kamal@example.com"
    },
    "item": {
      "productName": "Samsung 55 Inch Smart TV",
      "serialNumber": "SN-SAM55-889102",
      "unitPrice": 185000,
      "warrantyMonthsOverride": 24
    }
  }'`

  return (
    <div className="space-y-6">
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

      {/* POS & External Integrations Card */}
      <Card className="border-t-4 border-t-purple-600">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-600" />
            POS & External Billing Integrations (Section 16)
          </CardTitle>
          <CardDescription>
            Connect any billing software, cash register, WooCommerce store, or custom ERP to automatically issue digital warranties on sales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shop Identifier & Webhook Endpoint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
            <div>
              <Label className="text-xs font-semibold text-purple-900">Your Shop Slug</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-xs font-mono font-bold bg-white px-2.5 py-1.5 rounded border border-purple-200 text-purple-800">
                  {shop.slug || 'loading...'}
                </code>
              </div>
              <p className="text-[11px] text-purple-700 mt-1">Pass this in the <code>shopSlug</code> payload parameter</p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-purple-900">POS Webhook Endpoint</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookEndpoint}
                  className="text-xs font-mono bg-white px-2.5 py-1.5 rounded border border-purple-200 text-purple-900 flex-1 select-all"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookEndpoint)
                    setCopiedWebhook(true)
                    setTimeout(() => setCopiedWebhook(false), 2000)
                    toast.success('Webhook URL copied')
                  }}
                  className="h-8 px-2.5 text-xs text-purple-700"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-purple-700 mt-1">Send POST requests with <code>Content-Type: application/json</code></p>
            </div>
          </div>

          {/* Just-Created Key Banner */}
          {justCreatedKey && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                New Secret API Key Generated — Copy it now!
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs bg-white p-2 rounded border border-emerald-300 text-emerald-950 font-bold select-all break-all">
                  {justCreatedKey}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(justCreatedKey)
                    setCopiedKey(true)
                    setTimeout(() => setCopiedKey(false), 2000)
                    toast.success('API key copied to clipboard!')
                  }}
                  className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-[11px] text-emerald-700">
                For security, this secret key will not be displayed again. Store it securely in your POS terminal or billing application.
              </p>
            </div>
          )}

          {/* Active API Keys List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Active Integration Keys ({apiKeys.length})
              </h4>
            </div>

            {loadingKeys ? (
              <p className="text-xs text-gray-400 py-2">Loading keys...</p>
            ) : apiKeys.length === 0 ? (
              <div className="p-4 text-center border border-dashed rounded-lg text-xs text-gray-500">
                No integration keys created yet. Generate one below to connect your POS or billing system.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-3 flex items-center justify-between hover:bg-gray-50/60">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{k.name}</p>
                      <p className="text-[11px] font-mono text-gray-500">
                        {k.prefix} • Created {new Date(k.createdAt).toLocaleDateString()}
                        {k.lastUsedAt && ` • Last used: ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeKey(k.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Create Key Form */}
            <form onSubmit={handleCreateApiKey} className="flex gap-2 pt-2">
              <Input
                placeholder="Key label, e.g. Cashier Terminal 1 or WooCommerce"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="submit"
                disabled={creatingKey}
                size="sm"
                className="h-9 text-xs gap-1.5 bg-purple-700 hover:bg-purple-800 text-white shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {creatingKey ? 'Generating...' : 'Create API Key'}
              </Button>
            </form>
          </div>

          {/* Ready-to-use cURL Example */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                Quick POS Test Command (cURL)
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(sampleCurl)
                  setCopiedCurl(true)
                  setTimeout(() => setCopiedCurl(false), 2000)
                  toast.success('cURL command copied')
                }}
                className="h-7 px-2 text-xs text-gray-600"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedCurl ? 'Copied' : 'Copy cURL'}
              </Button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
              {sampleCurl}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
