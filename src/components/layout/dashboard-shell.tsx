'use client'

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface DashboardShellProps {
  children: React.ReactNode
  shopName?: string | null
  userRole?: string | null
  isPlatformAdmin?: boolean
  userName?: string | null
  userEmail?: string | null
}

export function DashboardShell({
  children,
  shopName,
  userRole,
  isPlatformAdmin,
  userName,
  userEmail,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar with Desktop fixed & Mobile overlay behavior */}
      <Sidebar
        shopName={shopName}
        userRole={userRole}
        isPlatformAdmin={isPlatformAdmin}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        <Header
          userName={userName}
          userEmail={userEmail}
          shopName={shopName}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
