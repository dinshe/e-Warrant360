'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Package,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ProductEditClientProps {
  product: {
    id: string
    name: string
    brand?: string | null
    modelNumber?: string | null
    sku?: string | null
    barcode?: string | null
    description?: string | null
    requiresSerialNumber: boolean
    purchaseCost?: any
    sellingPrice?: any
    defaultWarrantyMonths: number
    warrantyType: string
    warrantyTerms?: string | null
    warrantyExclusions?: string | null
    isActive: boolean
  }
  warrantiesCount: number
  canDelete: boolean
}

export function ProductEditClient({
  product,
  warrantiesCount,
  canDelete,
}: ProductEditClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: product.name,
    brand: product.brand || '',
    modelNumber: product.modelNumber || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    description: product.description || '',
    requiresSerialNumber: product.requiresSerialNumber,
    purchaseCost: product.purchaseCost ? String(product.purchaseCost) : '',
    sellingPrice: product.sellingPrice ? String(product.sellingPrice) : '',
    defaultWarrantyMonths: product.defaultWarrantyMonths,
    warrantyType: product.warrantyType,
    warrantyTerms: product.warrantyTerms || '',
    warrantyExclusions: product.warrantyExclusions || '',
    isActive: product.isActive,
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
        isActive: form.isActive,
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product')
      }

      toast.success('Product updated successfully!')
      router.push('/products')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error updating product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove product')
      }

      toast.success('Product removed from active catalogue')
      router.push('/products')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting product')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              All Products
            </Button>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">{product.name}</span>
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
            Delete Product
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-red-900">
                Confirm Product Removal
              </h4>
              <p className="text-xs text-red-700 leading-relaxed">
                This product is referenced in <strong>{warrantiesCount}</strong> issued warranties.
                Removing this product will mark it inactive and hide it from future warranty issuance,
                while preserving all historical warranty records.
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
                  {deleting ? 'Removing...' : 'Confirm Deletion'}
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
              <Package className="w-4 h-4 text-blue-600" />
              Product Identification & Stock
            </CardTitle>
            <CardDescription>
              Basic specifications and catalogue inventory rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Title / Name *</Label>
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
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. Sony, Samsung, Singer"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input
                  id="modelNumber"
                  value={form.modelNumber}
                  onChange={(e) => setForm((f) => ({ ...f, modelNumber: e.target.value }))}
                  placeholder="e.g. KDL-43W660"
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU Code</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. TV-SNY-43"
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="barcode">Barcode / EAN</Label>
                <Input
                  id="barcode"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="e.g. 490552488921"
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
            </div>
          </CardContent>
        </Card>

        {/* Pricing in LKR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing Reference (LKR)</CardTitle>
            <CardDescription>Sri Lankan Rupee cost and retail prices</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseCost">Purchase Cost (LKR)</Label>
              <Input
                id="purchaseCost"
                type="number"
                step="0.01"
                value={form.purchaseCost}
                onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))}
                placeholder="0.00"
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
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warranty Policy Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Warranty Policy</CardTitle>
            <CardDescription>
              Auto-populated when issuing new warranty certificates for this item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultWarrantyMonths">Warranty Period (Months) *</Label>
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
              <Label htmlFor="warrantyTerms">Standard Inclusions / Terms</Label>
              <Textarea
                id="warrantyTerms"
                value={form.warrantyTerms}
                onChange={(e) => setForm((f) => ({ ...f, warrantyTerms: e.target.value }))}
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="warrantyExclusions">Exclusions & Void Conditions</Label>
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

        {/* Submit */}
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
            {loading ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
