import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserCheck, Shield, PlusCircle, Mail, Phone, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { StaffInviteClient } from './staff-invite-client'

export default async function StaffPage() {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId

  const staffMembers = await prisma.shopUser.findMany({
    where: { shopId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Staff & Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage authorized shop users, team roles (Owner, Admin, Staff), and access rights
          </p>
        </div>

        <StaffInviteClient shopId={shopId} />
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Contact Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffMembers.map((su) => (
                  <tr key={su.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{su.user.name}</p>
                      {su.user.phone && (
                        <p className="text-xs text-gray-400">{su.user.phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {su.user.email}
                    </td>
                    <td className="px-5 py-4">
                      {su.role === 'OWNER' && (
                        <Badge variant="purple" className="font-semibold">Shop Owner</Badge>
                      )}
                      {su.role === 'ADMIN' && (
                        <Badge variant="default" className="font-semibold">Admin</Badge>
                      )}
                      {su.role === 'STAFF' && (
                        <Badge variant="secondary">Staff Member</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {su.isActive ? (
                        <span className="inline-flex items-center text-xs text-emerald-700 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-red-600 font-medium">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatDate(su.joinedAt)}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {su.user.lastLoginAt ? formatDate(su.user.lastLoginAt) : 'Never'}
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
