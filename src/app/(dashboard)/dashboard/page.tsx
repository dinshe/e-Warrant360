import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  ShieldCheck,
  Package,
  Users,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowRight,
  Wrench,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { WarrantyStatusBadge } from '@/components/warranties/warranty-status-badge'
import { WarrantyTrendChart, TrendDataPoint } from '@/components/dashboard/warranty-trend-chart'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
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

  // Calculate thirty days from now
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // Fetch operational metrics in parallel
  const [
    totalProducts,
    activeWarranties,
    expiringSoonWarranties,
    expiredWarranties,
    openClaims,
    totalCustomers,
    recentWarranties,
  ] = await Promise.all([
    prisma.product.count({ where: { shopId, deletedAt: null } }),
    prisma.warranty.count({ where: { shopId, status: 'ACTIVE' } }),
    prisma.warranty.count({
      where: {
        shopId,
        status: 'ACTIVE',
        warrantyEndDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
    }),
    prisma.warranty.count({
      where: {
        shopId,
        OR: [{ status: 'EXPIRED' }, { warrantyEndDate: { lt: new Date() } }],
      },
    }),
    prisma.warrantyClaim.count({
      where: {
        shopId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'UNDER_SERVICE'] },
      },
    }),
    prisma.customer.count({ where: { shopId, deletedAt: null } }),
    prisma.warranty.findMany({
      where: { shopId },
      include: {
        customer: { select: { name: true, phone: true } },
        product: { select: { name: true, modelNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  // Aggregate monthly trend for the last 6 months
  const monthSlots: { label: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setMonth(next.getMonth() + 1)
    monthSlots.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      start: d,
      end: next,
    })
  }

  const trendData: TrendDataPoint[] = await Promise.all(
    monthSlots.map(async (slot) => {
      const [active, expired, claimed] = await Promise.all([
        prisma.warranty.count({
          where: { shopId, createdAt: { gte: slot.start, lt: slot.end } },
        }),
        prisma.warranty.count({
          where: { shopId, warrantyEndDate: { gte: slot.start, lt: slot.end } },
        }),
        prisma.warrantyClaim.count({
          where: { shopId, createdAt: { gte: slot.start, lt: slot.end } },
        }),
      ])
      return {
        month: slot.label,
        active,
        expired,
        claimed,
      }
    })
  )

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Seller Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Operational overview and warranty lifecycle management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/warranties/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <PlusCircle className="w-4 h-4" />
              Create Warranty
            </Button>
          </Link>
          <Link href="/products/new">
            <Button variant="outline" className="gap-2">
              <Package className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Warranties
            </CardTitle>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeWarranties}</div>
            <p className="text-xs text-gray-500 mt-1">Currently covered items</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Expiring Soon
            </CardTitle>
            <Clock className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{expiringSoonWarranties}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Expiring within 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Open Claims
            </CardTitle>
            <Wrench className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{openClaims}</div>
            <p className="text-xs text-gray-500 mt-1">Under inspection or service</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Catalogue & Clients
            </CardTitle>
            <Users className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalProducts} <span className="text-sm font-normal text-gray-500">products</span></div>
            <p className="text-xs text-gray-500 mt-1">{totalCustomers} registered customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warranty & Service Velocity (6-Month Trend)</CardTitle>
          <CardDescription>
            Comparison of monthly issued warranties, registered service claims, and expired warranties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WarrantyTrendChart data={trendData} />
        </CardContent>
      </Card>

      {/* Operational Highlights & Recent Warranties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Warranties Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Issued Warranties</CardTitle>
              <CardDescription>Latest registered products and customer records</CardDescription>
            </div>
            <Link href="/warranties">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentWarranties.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No warranties issued yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start by clicking "Create Warranty" to register a sale.
                </p>
                <Link href="/warranties/new" className="inline-block mt-4">
                  <Button size="sm">Create First Warranty</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Warranty No</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Expiry</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentWarranties.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-blue-600">
                          <Link href={`/warranties/${w.id}`} className="hover:underline">
                            {w.warrantyNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{w.customer.name}</p>
                          <p className="text-xs text-gray-500">{w.customer.phone || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 font-medium truncate max-w-[180px]">
                            {w.product.name}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDate(w.warrantyEndDate)}
                        </td>
                        <td className="px-4 py-3">
                          <WarrantyStatusBadge status={w.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/warranties/${w.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                              Manage
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

        {/* Quick Operations & Sri Lanka SMB Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Search & Lookup</CardTitle>
              <CardDescription>Instant warranty verification by number</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/warranties" method="GET" className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    name="q"
                    type="text"
                    placeholder="e.g. EW360-7F4K92 or serial"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <Button type="submit" variant="secondary" className="w-full text-xs">
                  Search Warranties
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Digital Warranty System
              </CardTitle>
              <CardDescription className="text-blue-200">
                Direct customer engagement for Sri Lankan retailers
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-blue-100 space-y-2.5">
              <p>
                ✓ Every issued warranty generates an instant QR code.
              </p>
              <p>
                ✓ Customers can verify without installing any mobile app.
              </p>
              <p>
                ✓ Service claims, part replacements, and transfers are fully audited.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
