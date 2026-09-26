import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Settings, Store, MapPin, Shield, Bell } from 'lucide-react'
import { ShopSettingsClient } from './shop-settings-client'

export default async function SettingsPage() {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  })

  if (!shop) {
    return <div className="p-8 text-center text-gray-500">Shop profile not found</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Shop Configuration & Localization
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure business details, Sri Lankan location & registration, default warranty policy, and alerts
        </p>
      </div>

      <ShopSettingsClient shop={shop as any} />
    </div>
  )
}
