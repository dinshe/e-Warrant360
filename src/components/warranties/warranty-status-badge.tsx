import React from 'react'
import { Badge } from '@/components/ui/badge'

interface WarrantyStatusBadgeProps {
  status: string
  className?: string
}

export function WarrantyStatusBadge({ status, className }: WarrantyStatusBadgeProps) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success" className={className}>Active</Badge>
    case 'DRAFT':
      return <Badge variant="secondary" className={className}>Draft</Badge>
    case 'PENDING':
      return <Badge variant="warning" className={className}>Pending</Badge>
    case 'EXPIRED':
      return <Badge variant="destructive" className={className}>Expired</Badge>
    case 'CLAIMED':
      return <Badge variant="warning" className={className}>Claimed</Badge>
    case 'UNDER_SERVICE':
      return <Badge variant="purple" className={className}>Under Service</Badge>
    case 'REPAIRED':
      return <Badge variant="default" className={className}>Repaired</Badge>
    case 'REPLACED':
      return <Badge variant="default" className={className}>Replaced</Badge>
    case 'TRANSFERRED':
      return <Badge variant="secondary" className={className}>Transferred</Badge>
    case 'COMPLETED':
      return <Badge variant="success" className={className}>Completed</Badge>
    case 'VOIDED':
      return <Badge variant="destructive" className={className}>Voided</Badge>
    case 'CANCELLED':
      return <Badge variant="destructive" className={className}>Cancelled</Badge>
    case 'REJECTED':
      return <Badge variant="destructive" className={className}>Rejected</Badge>
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>
  }
}
