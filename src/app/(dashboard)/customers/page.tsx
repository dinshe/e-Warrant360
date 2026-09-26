import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function CustomersPage({
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
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const customers = await prisma.customer.findMany({
    where: whereClause,
    include: {
      warranties: {
        select: { id: true, warrantyNumber: true, status: true, warrantyEndDate: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Registered warranty holders, contact details, and historical warranty coverage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/api/export?type=customers" download>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </a>
          <Link href="/warranties/new">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <UserPlus className="w-4 h-4" />
              Issue to New Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" action="/customers" className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Search customers by name, phone number, email, or city..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-10 px-4">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No customers registered yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Customers are automatically registered when you issue a warranty or via the quick-add workflow.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Total Warranties</th>
                    <th className="px-5 py-3.5">Active Coverage</th>
                    <th className="px-5 py-3.5">Registered</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => {
                    const activeCount = c.warranties.filter((w) => w.status === 'ACTIVE').length
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <Link href={`/customers/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                            {c.name}
                          </Link>
                          {c.notes && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{c.notes}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs space-y-1">
                          {c.phone && (
                            <p className="flex items-center gap-1.5 text-gray-700">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {c.phone}
                            </p>
                          )}
                          {c.email && (
                            <p className="flex items-center gap-1.5 text-gray-500">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {c.email}
                            </p>
                          )}
                          {!c.phone && !c.email && <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-600">
                          {c.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {c.city}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-gray-800">
                          {c.warranties.length}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {activeCount > 0 ? (
                            <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {activeCount} Active
                            </span>
                          ) : (
                            <span className="text-gray-400">None Active</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/customers/${c.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700">
                              View Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
