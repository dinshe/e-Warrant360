import React from 'react'
import { prisma } from '@/lib/db'
import { Store, ShieldCheck, Users, Activity, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { AdminTenantClient } from './admin-tenant-client'

export default async function PlatformAdminPage() {
  const [totalShops, activeShops, totalWarranties, totalAuditLogs, shops] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: 'ACTIVE' } }),
    prisma.warranty.count(),
    prisma.auditLog.count(),
    prisma.shop.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            warranties: true,
            claims: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Tenant Directory & System Overview
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor tenant shops, enable or suspend merchant accounts, and track global system volume
        </p>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800/80 border-slate-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShops}</div>
            <p className="text-xs text-slate-400 mt-1">{activeShops} actively onboarded</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Issued Warranties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{totalWarranties}</div>
            <p className="text-xs text-slate-400 mt-1">Global platform total</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{totalAuditLogs}</div>
            <p className="text-xs text-slate-400 mt-1">Immutable security entries</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">Healthy</div>
            <p className="text-xs text-emerald-300 mt-1">All database nodes online</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card className="bg-slate-800/80 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-base text-white">Registered SMB Merchant Tenants</CardTitle>
          <CardDescription className="text-slate-400">
            Isolated tenant database containers with independent product, customer, and staff directories
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/60 border-b border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Shop Name</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Users</th>
                  <th className="px-5 py-3.5">Products</th>
                  <th className="px-5 py-3.5">Warranties</th>
                  <th className="px-5 py-3.5">Claims</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {shops.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.slug} • {s.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300">
                      {s.city ? `${s.city}, ` : ''}{s.district || 'Sri Lanka'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300">{s._count.users}</td>
                    <td className="px-5 py-4 text-xs text-slate-300">{s._count.products}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-blue-400">{s._count.warranties}</td>
                    <td className="px-5 py-4 text-xs text-purple-400">{s._count.claims}</td>
                    <td className="px-5 py-4">
                      {s.status === 'ACTIVE' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-950 text-red-300 border border-red-800">
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <AdminTenantClient shopId={s.id} currentStatus={s.status} shopName={s.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
