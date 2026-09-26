import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, PlusCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { WarrantyStatusBadge } from '@/components/warranties/warranty-status-badge'
import { formatDate } from '@/lib/utils'
import { CustomerEditClient } from './customer-edit-client'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId
  const userRole = (session?.user as any)?.role

  if (!shopId) notFound()

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, shopId, deletedAt: null },
    include: {
      warranties: {
        include: {
          product: { select: { name: true, brand: true, modelNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  const canDelete = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Customer Profile & Warranty History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review customer information, active warranty coverages, and product purchase history.
        </p>
      </div>

      {/* Edit Form */}
      <CustomerEditClient customer={customer} canDelete={canDelete} />

      {/* Associated Warranties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Issued Warranties ({customer.warranties.length})
            </CardTitle>
            <CardDescription>
              All products registered to this customer
            </CardDescription>
          </div>
          <Link href="/warranties/new">
            <Button size="sm" className="gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-3.5 h-3.5" />
              Issue Warranty
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {customer.warranties.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No warranties issued to this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Warranty No</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Serial / Invoice</th>
                    <th className="px-5 py-3">Valid Until</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customer.warranties.map((w) => (
                    <tr key={w.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">
                        <Link href={`/warranties/${w.id}`} className="hover:underline">
                          {w.warrantyNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{w.product.name}</p>
                        {w.product.brand && (
                          <p className="text-xs text-gray-400">{w.product.brand}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-600">
                        {w.serialNumber ? `SN: ${w.serialNumber}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {formatDate(w.warrantyEndDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <WarrantyStatusBadge status={w.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/warranties/${w.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            View
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
