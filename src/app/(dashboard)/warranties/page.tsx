import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  ShieldCheck,
  PlusCircle,
  Search,
  Filter,
  Download,
  Eye,
  FileCheck2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { WarrantyStatusBadge } from '@/components/warranties/warranty-status-badge'
import { formatDate } from '@/lib/utils'

export default async function WarrantiesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId

  const resolvedParams = await searchParams
  const search = resolvedParams?.q || ''
  const statusFilter = resolvedParams?.status || ''
  const page = Math.max(1, parseInt(resolvedParams?.page || '1'))
  const pageSize = 15

  const whereClause: any = {
    shopId,
    ...(statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(search
      ? {
          OR: [
            { warrantyNumber: { contains: search, mode: 'insensitive' } },
            { serialNumber: { contains: search, mode: 'insensitive' } },
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { customer: { phone: { contains: search, mode: 'insensitive' } } },
            { product: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const [warranties, totalCount] = await Promise.all([
    prisma.warranty.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        product: { select: { id: true, name: true, modelNumber: true, brand: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.warranty.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Warranty Registry
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage customer warranties, digital certificates, and verification statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/api/export?type=warranties" download>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </a>
          <Link href="/warranties/new">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <PlusCircle className="w-4 h-4" />
              Issue Warranty
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" action="/warranties" className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Search by warranty no, customer name, phone, serial, invoice..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-10 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CLAIMED">Claimed</option>
                <option value="UNDER_SERVICE">Under Service</option>
                <option value="REPAIRED">Repaired</option>
                <option value="REPLACED">Replaced</option>
                <option value="VOIDED">Voided</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="h-10 px-4">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Warranties Table */}
      <Card>
        <CardContent className="p-0">
          {warranties.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No warranty records found</p>
              <p className="text-xs text-gray-400 mt-1">
                {search || statusFilter ? 'Try clearing your search filters' : 'Start by issuing a new warranty'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Warranty No</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Product & Model</th>
                    <th className="px-5 py-3.5">Serial / Invoice</th>
                    <th className="px-5 py-3.5">Coverage End</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {warranties.map((w) => (
                    <tr key={w.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-blue-600">
                        <Link href={`/warranties/${w.id}`} className="hover:underline">
                          {w.warrantyNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{w.customer.name}</p>
                        <p className="text-xs text-gray-500">{w.customer.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{w.product.name}</p>
                        <p className="text-xs text-gray-500">
                          {w.product.brand ? `${w.product.brand} ` : ''}
                          {w.product.modelNumber ? `(${w.product.modelNumber})` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-gray-600 space-y-0.5">
                        {w.serialNumber && <div>SN: {w.serialNumber}</div>}
                        {w.invoiceNumber && <div className="text-gray-400">Inv: {w.invoiceNumber}</div>}
                        {!w.serialNumber && !w.invoiceNumber && <div>—</div>}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <p className="font-medium text-gray-800">{formatDate(w.warrantyEndDate)}</p>
                        <p className="text-[11px] text-gray-400">{w.warrantyMonths} Months</p>
                      </td>
                      <td className="px-5 py-4">
                        <WarrantyStatusBadge status={w.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/verify/${w.verificationToken}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-600 hover:text-blue-600" title="Public Certificate">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/warranties/${w.id}`}>
                            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing Page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/warranties?page=${page - 1}&q=${search}&status=${statusFilter}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/warranties?page=${page + 1}&q=${search}&status=${statusFilter}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
