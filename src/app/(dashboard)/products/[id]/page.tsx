import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProductEditClient } from './product-edit-client'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const shopId = (session?.user as any)?.shopId
  const userRole = (session?.user as any)?.role

  if (!shopId) notFound()

  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, shopId, deletedAt: null },
    include: {
      _count: { select: { warranties: true } },
    },
  })

  if (!product) {
    notFound()
  }

  const canDelete = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Product Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review specifications, default warranty periods, and serialization settings.
        </p>
      </div>

      <ProductEditClient
        product={product}
        warrantiesCount={product._count.warranties}
        canDelete={canDelete}
      />
    </div>
  )
}
