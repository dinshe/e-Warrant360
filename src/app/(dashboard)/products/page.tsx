import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  Package,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatLKR } from '@/lib/utils'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId

  if (!shopId) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Shop Not Found</h2>
        <p className="text-gray-500 mt-2">
          Your account is not currently associated with an active shop profile.
        </p>
      </div>
    )
  }

  const resolvedParams = await searchParams
  const search = resolvedParams?.q || ''

  const whereClause: any = {
    shopId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { modelNumber: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: true,
      _count: { select: { warranties: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Product Catalogue
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure shop items, default warranty periods, and serial tracking rules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/api/export?type=products" download>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Products
            </Button>
          </a>
          <Link href="/products/new">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <PlusCircle className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" action="/products" className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Search products by name, brand, model, SKU..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-10 px-4">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No products in catalogue</p>
              <p className="text-xs text-gray-400 mt-1">
                Add products once so you can quickly issue warranties on sales.
              </p>
              <Link href="/products/new" className="inline-block mt-4">
                <Button size="sm">Add First Product</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Product Name</th>
                    <th className="px-5 py-3.5">Brand & Model</th>
                    <th className="px-5 py-3.5">SKU</th>
                    <th className="px-5 py-3.5">Default Warranty</th>
                    <th className="px-5 py-3.5">Price (LKR)</th>
                    <th className="px-5 py-3.5">Serial Required</th>
                    <th className="px-5 py-3.5">Warranties Issued</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline">
                          {p.name}
                        </Link>
                        {p.category && (
                          <span className="block text-xs font-normal text-gray-400">
                            {p.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        <p className="font-medium text-gray-800">{p.brand || '—'}</p>
                        <p className="text-gray-400">{p.modelNumber || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-gray-600">
                        {p.sku || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="font-semibold text-blue-700">
                          {p.defaultWarrantyMonths} Months
                        </span>
                        <span className="block text-[11px] text-gray-400 capitalize">
                          {p.warrantyType.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-gray-800">
                        {formatLKR(p.sellingPrice ? Number(p.sellingPrice) : null)}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {p.requiresSerialNumber ? (
                          <span className="inline-flex items-center text-amber-700 font-medium">
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">Optional</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-gray-700">
                        {p._count.warranties}
                      </td>
                      <td className="px-5 py-4">
                        {p.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/products/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700">
                            Edit
                          </Button>
                        </Link>
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
