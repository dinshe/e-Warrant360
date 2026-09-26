'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ShieldCheck,
  ArrowLeft,
  Calendar,
  UserPlus,
  Package,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ProductOption {
  id: string
  name: string
  brand?: string | null
  modelNumber?: string | null
  sku?: string | null
  requiresSerialNumber: boolean
  defaultWarrantyMonths: number
  warrantyType: string
  warrantyTerms?: string | null
  warrantyExclusions?: string | null
  sellingPrice?: number | null
}

interface CustomerOption {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  city?: string | null
}

export default function NewWarrantyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)

  // Options loaded from shop
  const [products, setProducts] = useState<ProductOption[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])

  // Modal / toggle for quick customer creation
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerCity, setNewCustomerCity] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12)
  const [warrantyType, setWarrantyType] = useState('SELLER')
  const [purchasePrice, setPurchasePrice] = useState<string>('')
  const [terms, setTerms] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [notes, setNotes] = useState('')

  // Load products and customers on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [prodRes, custRes] = await Promise.all([
          fetch('/api/products?limit=100'),
          fetch('/api/customers?limit=100'),
        ])

        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setProducts(prodData.data || [])
        }

        if (custRes.ok) {
          const custData = await custRes.json()
          setCustomers(custData.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch catalogue data', err)
        toast.error('Failed to load products or customers')
      } finally {
        setFetchingData(false)
      }
    }

    loadInitialData()
  }, [])

  // Auto-populate warranty duration & terms when product changes
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    const product = products.find((p) => p.id === productId)
    if (product) {
      setWarrantyMonths(product.defaultWarrantyMonths || 12)
      setWarrantyType(product.warrantyType || 'SELLER')
      setTerms(product.warrantyTerms || '')
      setExclusions(product.warrantyExclusions || '')
      if (product.sellingPrice) {
        setPurchasePrice(product.sellingPrice.toString())
      }
    }
  }

  // Calculate calculated end date for visual preview
  const calculatedEndDate = React.useMemo(() => {
    if (!purchaseDate) return '—'
    const date = new Date(purchaseDate)
    if (isNaN(date.getTime())) return '—'
    date.setMonth(date.getMonth() + Number(warrantyMonths || 0))
    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [purchaseDate, warrantyMonths])

  // Quick Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) {
      toast.error('Customer name is required')
      return
    }

    setCreatingCustomer(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          email: newCustomerEmail.trim() || undefined,
          city: newCustomerCity.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create customer')
      }

      setCustomers((prev) => [data.data, ...prev])
      setSelectedCustomerId(data.data.id)
      setShowQuickCustomer(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setNewCustomerEmail('')
      setNewCustomerCity('')
      toast.success('Customer registered and selected!')
    } catch (err: any) {
      toast.error(err.message || 'Error creating customer')
    } finally {
      setCreatingCustomer(false)
    }
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomerId) {
      toast.error('Please select or create a customer')
      return
    }

    if (!selectedProductId) {
      toast.error('Please select a product')
      return
    }

    const selectedProduct = products.find((p) => p.id === selectedProductId)
    if (selectedProduct?.requiresSerialNumber && !serialNumber.trim()) {
      toast.error('Serial number is required for this product')
      return
    }

    setLoading(true)
    try {
      const payload = {
        customerId: selectedCustomerId,
        productId: selectedProductId,
        serialNumber: serialNumber.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        warrantyStartDate: purchaseDate,
        warrantyMonths: Number(warrantyMonths),
        warrantyType,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        terms: terms.trim() || undefined,
        exclusions: exclusions.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      const res = await fetch('/api/warranties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue warranty')
      }

      toast.success(`Warranty ${data.data.warrantyNumber} successfully created!`)
      router.push(`/warranties/${data.data.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Error creating warranty')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center gap-3">
        <Link href="/warranties">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
            Back to Warranties
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Issue New Digital Warranty
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fast seller workflow: select customer and product, review dates, and generate digital certificate.
        </p>
      </div>

      {fetchingData ? (
        <Card className="p-12 text-center text-gray-500">
          Loading shop catalogue and customer directory...
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                    Select or Create Customer
                  </CardTitle>
                  <CardDescription>The warranty holder or buyer</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                  className="gap-1.5 text-xs text-blue-600"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {showQuickCustomer ? 'Close Quick Add' : 'Quick Add Customer'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showQuickCustomer && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 mb-4">
                  <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    New Customer Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="e.g. Kasun Perera"
                        className="bg-white mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Mobile Number (Sri Lanka)</Label>
                      <Input
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="e.g. 0771234567 or +9477..."
                        className="bg-white mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email Address (Optional)</Label>
                      <Input
                        type="email"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="bg-white mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">City / Town</Label>
                      <Input
                        value={newCustomerCity}
                        onChange={(e) => setNewCustomerCity(e.target.value)}
                        placeholder="e.g. Colombo 03, Kandy"
                        className="bg-white mt-1 h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowQuickCustomer(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingCustomer}
                      onClick={handleCreateCustomer}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      {creatingCustomer ? 'Saving...' : 'Save & Select Customer'}
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="customerSelect">Customer</Label>
                <select
                  id="customerSelect"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">-- Choose Existing Customer ({customers.length}) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} {c.city ? `- ${c.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Product Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                Select Product from Catalogue
              </CardTitle>
              <CardDescription>
                Warranty rules, terms, and period will automatically load from product settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productSelect">Product</Label>
                <select
                  id="productSelect"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">-- Select Product ({products.length}) --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.brand ? `[${p.brand}]` : ''} {p.modelNumber ? `(${p.modelNumber})` : ''} - {p.defaultWarrantyMonths}M Warranty
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct?.requiresSerialNumber && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>This product is configured to require a unique unit serial number.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Transaction & Identification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                Sale & Unit Details
              </CardTitle>
              <CardDescription>
                Invoice reference, unit serial number, and purchase date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice / Bill Reference Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2024-8849"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="serialNumber">
                    Serial Number {selectedProduct?.requiresSerialNumber ? '*' : '(Optional)'}
                  </Label>
                  <Input
                    id="serialNumber"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-SAM55-992384"
                    className="mt-1 font-mono"
                    required={selectedProduct?.requiresSerialNumber}
                  />
                </div>

                <div>
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="purchasePrice">Selling Price (LKR)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 175000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Policy & Review */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                Warranty Period & Policy Review
              </CardTitle>
              <CardDescription>
                Server-validated dates and product coverage rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Coverage Duration</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Input
                      type="number"
                      min="1"
                      max="600"
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                      className="w-20 text-center font-bold h-8 text-sm bg-white"
                    />
                    <span className="text-xs text-slate-600 font-medium">Months</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">Start Date</p>
                  <p className="font-bold text-slate-800 text-sm mt-2">{purchaseDate || '—'}</p>
                </div>

                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase">Calculated Expiry</p>
                  <p className="font-extrabold text-blue-900 text-sm mt-2">{calculatedEndDate}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="terms">Warranty Terms & Inclusions</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Terms pre-loaded from product..."
                  className="mt-1 text-xs"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="exclusions">Exclusions & Void Conditions</Label>
                <Textarea
                  id="exclusions"
                  value={exclusions}
                  onChange={(e) => setExclusions(e.target.value)}
                  placeholder="e.g. Physical damage, water ingress, unauthorized repairs..."
                  className="mt-1 text-xs"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Seller Notes (Private to Shop)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal remark..."
                  className="mt-1 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/warranties">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[160px]"
            >
              {loading ? (
                'Issuing Record...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Generate Warranty
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
