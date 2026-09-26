'use client'

import React from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  userName?: string | null
  userEmail?: string | null
  shopName?: string | null
  onMenuClick?: () => void
}

export function Header({ userName, userEmail, shopName, onMenuClick }: HeaderProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-md">
          {shopName || 'e-warrant360 Seller Hub'}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* User profile details */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-900 leading-tight">
              {userName || 'Seller'}
            </p>
            <p className="text-[11px] text-gray-500 leading-tight">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-gray-600 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5 h-8 px-2 sm:px-3"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  )
}
