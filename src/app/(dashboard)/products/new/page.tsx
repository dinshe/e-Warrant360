'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Package, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    brand: '',
    modelNumber: '',
    sku: '',
    barcode: '',
    description: '',
    requiresSerialNumber: false,
    purchaseCost: '',
    sellingPrice: '',
    defaultWarrantyMonths: 12,
    warrantyType: 'SELLER',
    warrantyTerms: 'Standard seller warranty covering manufacturer defects and component failures under normal consumer use.',
    warrantyExclusions: 'Physical impact damage, liquid ingress, unauthorized tampering or third-party repair, surge damage.',
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Product name is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        modelNumber: form.modelNumber.trim() || undefined,
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
        requiresSerialNumber: Boolean(form.requiresSerialNumber),
        purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
        defaultWarrantyMonths: Number(form.defaultWarrantyMonths || 12),
        warrantyType: form.warrantyType,
        warrantyTerms: form.warrantyTerms.trim() || undefined,
        warrantyExclusions: form.warrantyExclusions.trim() || undefined,
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product')
      }

      toast.success('Product added to catalogue successfully!')
      router.push('/products')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error creating product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
            Back to Catalogue
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Add New Product
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Define product specifications, warranty defaults, and coverage exclusions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Identification</CardTitle>
            <CardDescription>Name, brand, model, and inventory tracking identifiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Samsung 55' UHD 4K Smart TV"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. Samsung, LG, Sony, Singer"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input
                  id="modelNumber"
                  value={form.modelNumber}
                  onChange={(e) => setForm((f) => ({ ...f, modelNumber: e.target.value }))}
                  placeholder="e.g. UA55CU7000"
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. SAM-55-TV"
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="barcode">Barcode / EAN</Label>
                <Input
                  id="barcode"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="e.g. 8806091234567"
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.requiresSerialNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiresSerialNumber: e.target.checked }))
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  Require serial number entry when issuing warranties for this product
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-0.5">
                Recommended for electronics, appliances, and high-value serialized goods.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing in LKR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing (Sri Lankan Rupee - LKR)</CardTitle>
            <CardDescription>Optional reference amounts for warranty records and receipts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseCost">Cost Price (LKR)</Label>
              <Input
                id="purchaseCost"
                type="number"
                step="0.01"
                value={form.purchaseCost}
                onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))}
                placeholder="e.g. 140000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Selling Price (LKR)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                placeholder="e.g. 175000"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warranty Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Warranty Policy</CardTitle>
            <CardDescription>These terms will auto-populate when a seller selects this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultWarrantyMonths">Default Coverage Duration (Months) *</Label>
                <Input
                  id="defaultWarrantyMonths"
                  type="number"
                  min="0"
                  max="600"
                  value={form.defaultWarrantyMonths}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultWarrantyMonths: Number(e.target.value) }))
                  }
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="warrantyType">Warranty Classification</Label>
                <select
                  id="warrantyType"
                  value={form.warrantyType}
                  onChange={(e) => setForm((f) => ({ ...f, warrantyType: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="SELLER">Seller Warranty</option>
                  <option value="MANUFACTURER">Manufacturer Warranty</option>
                  <option value="EXTENDED">Extended Warranty</option>
                  <option value="LIMITED">Limited Warranty</option>
                  <option value="LIFETIME">Lifetime Warranty</option>
                  <option value="CUSTOM">Custom Warranty</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="warrantyTerms">Warranty Terms & Coverage Inclusions</Label>
              <Textarea
                id="warrantyTerms"
                value={form.warrantyTerms}
                onChange={(e) => setForm((f) => ({ ...f, warrantyTerms: e.target.value }))}
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="warrantyExclusions">Exclusions & Void Rules</Label>
              <Textarea
                id="warrantyExclusions"
                value={form.warrantyExclusions}
                onChange={(e) => setForm((f) => ({ ...f, warrantyExclusions: e.target.value }))}
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {loading ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Save Product</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
