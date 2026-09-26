import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { History, Shield, User, Clock, Terminal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default async function AuditTrailPage() {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId

  const logs = await prisma.auditLog.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Audit Trail & Security Log
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Immutable event log tracking warranty creations, transfers, service updates, and administrative actions
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No audit events recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Action</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Target Entity</th>
                    <th className="px-5 py-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <p className="font-medium text-gray-900">{log.actorName || 'System'}</p>
                        {log.actorEmail && (
                          <p className="text-gray-400">{log.actorEmail}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-gray-700">
                        {log.entityType ? `${log.entityType} (${log.entityId?.slice(0, 8)}...)` : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600 max-w-sm">
                        {log.metadata ? (
                          <code className="text-[11px] bg-gray-100 px-2 py-1 rounded text-gray-800 break-all">
                            {JSON.stringify(log.metadata)}
                          </code>
                        ) : (
                          '—'
                        )}
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
