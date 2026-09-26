'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  Users,
  Wrench,
  UserCheck,
  Settings,
  History,
  ExternalLink,
  Store,
  X,
} from 'lucide-react'

interface SidebarProps {
  shopName?: string | null
  userRole?: string | null
  isPlatformAdmin?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Warranties', href: '/warranties', icon: ShieldCheck },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Claims & Service', href: '/claims', icon: Wrench },
  { label: 'Staff Members', href: '/staff', icon: UserCheck, roles: ['OWNER', 'ADMIN'] },
  { label: 'Shop Settings', href: '/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
  { label: 'Audit Trail', href: '/audit', icon: History, roles: ['OWNER', 'ADMIN'] },
]

export function Sidebar({
  shopName,
  userRole,
  isPlatformAdmin,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()

  const handleNavClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Drawer / Sidebar */}
      <aside
        className={cn(
          'w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-40 select-none transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              EW
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-tight leading-none">
                e-warrant360
              </span>
              <span className="text-[11px] text-blue-400 mt-1 font-medium">Sri Lanka SMB Edition</span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shop Info Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <Store className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {shopName || 'My Shop'}
              </p>
              <p className="text-[11px] text-slate-400 capitalize">
                Role: <span className="text-slate-300 font-medium">{userRole?.toLowerCase() || 'Staff'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.roles || (userRole && item.roles.includes(userRole)))
            .map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    )}
                  />
                  {item.label}
                </Link>
              )
            })}
        </nav>

        {/* Super Admin & Quick Links */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {isPlatformAdmin && (
            <Link
              href="/admin"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-950/40 border border-amber-800/40 transition-colors"
            >
              Platform Admin
            </Link>
          )}

          <Link
            href="/verify"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <span>Verify Warranty Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  )
}
