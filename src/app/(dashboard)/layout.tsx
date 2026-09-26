import React from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as any

  return (
    <DashboardShell
      shopName={user.shopName}
      userRole={user.role}
      isPlatformAdmin={user.isPlatformAdmin}
      userName={user.name}
      userEmail={user.email}
    >
      {children}
    </DashboardShell>
  )
}
