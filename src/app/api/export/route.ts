import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Papa from 'papaparse'

// Formula injection protection: prepend single quote to fields starting with =, +, -, @
function sanitizeCell(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`
  }
  return str
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = (session.user as any).shopId
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'warranties' | 'products' | 'customers'

  try {
    let csvData: any[] = []
    let filename = `export-${type}-${Date.now()}.csv`

    if (type === 'warranties') {
      const warranties = await prisma.warranty.findMany({
        where: { shopId },
        include: {
          product: { select: { name: true, sku: true, modelNumber: true } },
          customer: { select: { name: true, phone: true, email: true } },
          issuedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      csvData = warranties.map((w) => ({
        'Warranty Number': sanitizeCell(w.warrantyNumber),
        Status: sanitizeCell(w.status),
        Customer: sanitizeCell(w.customer.name),
        Phone: sanitizeCell(w.customer.phone),
        Email: sanitizeCell(w.customer.email),
        Product: sanitizeCell(w.product.name),
        SKU: sanitizeCell(w.product.sku),
        Model: sanitizeCell(w.product.modelNumber),
        'Serial Number': sanitizeCell(w.serialNumber),
        'Invoice Ref': sanitizeCell(w.invoiceNumber),
        'Purchase Date': sanitizeCell(w.purchaseDate.toISOString().split('T')[0]),
        'Expiry Date': sanitizeCell(w.warrantyEndDate.toISOString().split('T')[0]),
        'Months Covered': sanitizeCell(w.warrantyMonths),
        'Selling Price (LKR)': sanitizeCell(w.purchasePrice),
        'Issued By': sanitizeCell(w.issuedBy.name),
        'Created At': sanitizeCell(w.createdAt.toISOString()),
      }))
    } else if (type === 'products') {
      const products = await prisma.product.findMany({
        where: { shopId, deletedAt: null },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      })

      csvData = products.map((p) => ({
        Name: sanitizeCell(p.name),
        Brand: sanitizeCell(p.brand),
        Model: sanitizeCell(p.modelNumber),
        SKU: sanitizeCell(p.sku),
        Barcode: sanitizeCell(p.barcode),
        Category: sanitizeCell(p.category?.name),
        'Default Months': sanitizeCell(p.defaultWarrantyMonths),
        'Warranty Type': sanitizeCell(p.warrantyType),
        'Serial Required': p.requiresSerialNumber ? 'Yes' : 'No',
        'Selling Price (LKR)': sanitizeCell(p.sellingPrice),
        'Cost Price (LKR)': sanitizeCell(p.purchaseCost),
        Status: p.isActive ? 'Active' : 'Inactive',
      }))
    } else if (type === 'customers') {
      const customers = await prisma.customer.findMany({
        where: { shopId, deletedAt: null },
        include: { _count: { select: { warranties: true } } },
        orderBy: { createdAt: 'desc' },
      })

      csvData = customers.map((c) => ({
        Name: sanitizeCell(c.name),
        Phone: sanitizeCell(c.phone),
        Email: sanitizeCell(c.email),
        Address: sanitizeCell(c.addressLine1),
        City: sanitizeCell(c.city),
        District: sanitizeCell(c.district),
        'Warranties Count': c._count.warranties,
        Registered: sanitizeCell(c.createdAt.toISOString().split('T')[0]),
      }))
    } else {
      return NextResponse.json({ error: 'Invalid export type. Use warranties, products, or customers' }, { status: 400 })
    }

    const csvString = Papa.unparse(csvData)

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('[EXPORT_ERROR]', err)
    return NextResponse.json({ error: 'Failed to generate export file' }, { status: 500 })
  }
}
