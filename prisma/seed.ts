import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

const prisma = new PrismaClient()

function generateWarrantyNum() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'EW360-'
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

async function main() {
  console.log('🌱 Seeding e-warrant360 database...')

  // 1. Create Platform Admin
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 12)
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@ewarrant360.lk' },
    update: {},
    create: {
      email: 'admin@ewarrant360.lk',
      name: 'Platform Super Admin',
      passwordHash: adminPasswordHash,
      isPlatformAdmin: true,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })
  console.log('✓ Platform Admin created:', platformAdmin.email)

  // 2. Create Demo Sri Lankan Shop: Colombo Tech Mart
  const shop = await prisma.shop.upsert({
    where: { slug: 'colombo-tech-mart' },
    update: {},
    create: {
      name: 'Colombo Tech Mart',
      slug: 'colombo-tech-mart',
      email: 'sales@colombotech.lk',
      phone: '+94112589000',
      website: 'https://colombotech.lk',
      addressLine1: '142 Galle Road',
      addressLine2: 'Bambalapitiya',
      city: 'Colombo 04',
      district: 'Colombo',
      province: 'WESTERN',
      postalCode: '00400',
      businessRegNumber: 'PV-98234/2021',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      status: 'ACTIVE',
      defaultWarrantyMonths: 12,
      warrantyPolicy:
        'Official warranty valid across all Colombo Tech Mart authorized service centers in Sri Lanka. Retain digital warranty certificate or SMS reference for verification.',
      claimPolicy:
        'Claims inspected within 48 business hours. Replacement units provided if repair exceeds 7 working days.',
    },
  })
  console.log('✓ Shop created:', shop.name)

  // 3. Create Shop Owner & Staff
  const ownerPasswordHash = await bcrypt.hash('SellerPass123!', 12)
  const shopOwner = await prisma.user.upsert({
    where: { email: 'kasun@colombotech.lk' },
    update: {},
    create: {
      email: 'kasun@colombotech.lk',
      name: 'Kasun Perera (Shop Owner)',
      phone: '+94771230001',
      passwordHash: ownerPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })

  await prisma.shopUser.upsert({
    where: { shopId_userId: { shopId: shop.id, userId: shopOwner.id } },
    update: {},
    create: {
      shopId: shop.id,
      userId: shopOwner.id,
      role: 'OWNER',
    },
  })

  const staffPasswordHash = await bcrypt.hash('StaffPass123!', 12)
  const staffMember = await prisma.user.upsert({
    where: { email: 'nuwan@colombotech.lk' },
    update: {},
    create: {
      email: 'nuwan@colombotech.lk',
      name: 'Nuwan Senanayake (Staff)',
      phone: '+94771230002',
      passwordHash: staffPasswordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })

  await prisma.shopUser.upsert({
    where: { shopId_userId: { shopId: shop.id, userId: staffMember.id } },
    update: {},
    create: {
      shopId: shop.id,
      userId: staffMember.id,
      role: 'STAFF',
    },
  })
  console.log('✓ Shop users created: Owner (kasun@colombotech.lk), Staff (nuwan@colombotech.lk)')

  // 4. Create Product Categories
  const catElectronics = await prisma.category.upsert({
    where: { shopId_slug: { shopId: shop.id, slug: 'electronics' } },
    update: {},
    create: {
      shopId: shop.id,
      name: 'Televisions & Displays',
      slug: 'electronics',
    },
  })

  const catAppliances = await prisma.category.upsert({
    where: { shopId_slug: { shopId: shop.id, slug: 'appliances' } },
    update: {},
    create: {
      shopId: shop.id,
      name: 'Home Appliances',
      slug: 'appliances',
    },
  })

  // 5. Create Products
  const tvProduct = await prisma.product.upsert({
    where: { shopId_sku: { shopId: shop.id, sku: 'SAM55TV' } },
    update: {},
    create: {
      shopId: shop.id,
      categoryId: catElectronics.id,
      name: 'Samsung 55" Crystal UHD 4K Smart TV',
      brand: 'Samsung',
      modelNumber: 'UA55CU7000',
      sku: 'SAM55TV',
      barcode: '8806091234567',
      requiresSerialNumber: true,
      purchaseCost: 145000,
      sellingPrice: 185000,
      defaultWarrantyMonths: 24,
      warrantyType: 'SELLER',
      warrantyTerms: 'Comprehensive 2-year warranty covering display panel, mainboard, and power supply.',
      warrantyExclusions: 'Physical screen cracks, lightning strikes, surge damage without surge protector.',
      isActive: true,
    },
  })

  const acProduct = await prisma.product.upsert({
    where: { shopId_sku: { shopId: shop.id, sku: 'LG12AC' } },
    update: {},
    create: {
      shopId: shop.id,
      categoryId: catAppliances.id,
      name: 'LG Dual Inverter Smart Air Conditioner 12000 BTU',
      brand: 'LG',
      modelNumber: 'S3-Q12JA2PA',
      sku: 'LG12AC',
      barcode: '8806097654321',
      requiresSerialNumber: true,
      purchaseCost: 195000,
      sellingPrice: 245000,
      defaultWarrantyMonths: 60,
      warrantyType: 'MANUFACTURER',
      warrantyTerms: '5 years comprehensive compressor warranty, 1 year full unit electrical coverage.',
      warrantyExclusions: 'Refrigerant gas leakage caused by external damage or uncertified installation.',
      isActive: true,
    },
  })

  const speakerProduct = await prisma.product.upsert({
    where: { shopId_sku: { shopId: shop.id, sku: 'JBLCHG5' } },
    update: {},
    create: {
      shopId: shop.id,
      categoryId: catElectronics.id,
      name: 'JBL Charge 5 Portable Waterproof Speaker',
      brand: 'JBL',
      modelNumber: 'JBLCHARGE5BLU',
      sku: 'JBLCHG5',
      barcode: '6925281982123',
      requiresSerialNumber: false,
      purchaseCost: 38000,
      sellingPrice: 48000,
      defaultWarrantyMonths: 12,
      warrantyType: 'SELLER',
      warrantyTerms: '1 year battery and driver replacement warranty.',
      warrantyExclusions: 'Submersion beyond IP67 rating limits or port corrosion.',
      isActive: true,
    },
  })
  console.log('✓ Products seeded (Samsung 55" TV, LG Inverter AC, JBL Speaker)')

  // 6. Create Customers
  const customerDilshan = await prisma.customer.upsert({
    where: { shopId_phone: { shopId: shop.id, phone: '0771234567' } },
    update: {},
    create: {
      shopId: shop.id,
      name: 'Dilshan Silva',
      phone: '0771234567',
      email: 'dilshan.silva@gmail.com',
      addressLine1: '45/2 Alfred House Gardens',
      city: 'Colombo 03',
      district: 'Colombo',
      notes: 'VIP customer, frequent buyer',
    },
  })

  const customerChamari = await prisma.customer.upsert({
    where: { shopId_phone: { shopId: shop.id, phone: '0719876543' } },
    update: {},
    create: {
      shopId: shop.id,
      name: 'Chamari Atapattu',
      phone: '0719876543',
      email: 'chamari.a@yahoo.com',
      addressLine1: '12 Peradeniya Road',
      city: 'Kandy',
      district: 'Kandy',
    },
  })
  console.log('✓ Customers seeded (Dilshan Silva, Chamari Atapattu)')

  // 7. Create Warranties
  // Warranty 1: Active Samsung TV
  const now = new Date()
  const purchaseDate1 = new Date(now)
  purchaseDate1.setMonth(purchaseDate1.getMonth() - 2)
  const endDate1 = new Date(purchaseDate1)
  endDate1.setMonth(endDate1.getMonth() + 24)

  const w1 = await prisma.warranty.upsert({
    where: { warrantyNumber: 'EW360-7F4K92' },
    update: {},
    create: {
      shopId: shop.id,
      warrantyNumber: 'EW360-7F4K92',
      verificationToken: 'vtok_7f4k92_demo_cryptotoken_srilanka_98721',
      customerId: customerDilshan.id,
      productId: tvProduct.id,
      issuedById: shopOwner.id,
      status: 'ACTIVE',
      warrantyType: 'SELLER',
      serialNumber: 'SN-SAM55-8849102',
      invoiceNumber: 'INV-2024-001',
      purchaseDate: purchaseDate1,
      warrantyStartDate: purchaseDate1,
      warrantyEndDate: endDate1,
      warrantyMonths: 24,
      purchasePrice: 185000,
      terms: tvProduct.warrantyTerms,
      exclusions: tvProduct.warrantyExclusions,
      activatedAt: purchaseDate1,
    },
  })

  await prisma.warrantyEvent.create({
    data: {
      warrantyId: w1.id,
      toStatus: 'ACTIVE',
      actorId: shopOwner.id,
      actorName: shopOwner.name,
      note: 'Initial sale and warranty activation',
    },
  })

  // Warranty 2: Expiring Soon AC (bought 11.5 months ago with 12M coverage for unit)
  const purchaseDate2 = new Date(now)
  purchaseDate2.setMonth(purchaseDate2.getMonth() - 11)
  purchaseDate2.setDate(purchaseDate2.getDate() - 15)
  const endDate2 = new Date(purchaseDate2)
  endDate2.setMonth(endDate2.getMonth() + 12) // expires in ~15 days

  const w2 = await prisma.warranty.upsert({
    where: { warrantyNumber: 'EW360-9B2M18' },
    update: {},
    create: {
      shopId: shop.id,
      warrantyNumber: 'EW360-9B2M18',
      verificationToken: 'vtok_9b2m18_demo_cryptotoken_srilanka_12345',
      customerId: customerChamari.id,
      productId: acProduct.id,
      issuedById: staffMember.id,
      status: 'ACTIVE',
      warrantyType: 'MANUFACTURER',
      serialNumber: 'SN-LGAC-1192837',
      invoiceNumber: 'INV-2023-884',
      purchaseDate: purchaseDate2,
      warrantyStartDate: purchaseDate2,
      warrantyEndDate: endDate2,
      warrantyMonths: 12,
      purchasePrice: 245000,
      terms: acProduct.warrantyTerms,
      exclusions: acProduct.warrantyExclusions,
      activatedAt: purchaseDate2,
    },
  })

  // Warranty 3: In Service / Claimed (JBL Speaker)
  const purchaseDate3 = new Date(now)
  purchaseDate3.setMonth(purchaseDate3.getMonth() - 4)
  const endDate3 = new Date(purchaseDate3)
  endDate3.setMonth(endDate3.getMonth() + 12)

  const w3 = await prisma.warranty.upsert({
    where: { warrantyNumber: 'EW360-3P8X41' },
    update: {},
    create: {
      shopId: shop.id,
      warrantyNumber: 'EW360-3P8X41',
      verificationToken: 'vtok_3p8x41_demo_cryptotoken_srilanka_67890',
      customerId: customerDilshan.id,
      productId: speakerProduct.id,
      issuedById: shopOwner.id,
      status: 'UNDER_SERVICE',
      warrantyType: 'SELLER',
      serialNumber: 'JBL-CHG5-66778',
      invoiceNumber: 'INV-2024-332',
      purchaseDate: purchaseDate3,
      warrantyStartDate: purchaseDate3,
      warrantyEndDate: endDate3,
      warrantyMonths: 12,
      purchasePrice: 48000,
      terms: speakerProduct.warrantyTerms,
      exclusions: speakerProduct.warrantyExclusions,
      activatedAt: purchaseDate3,
    },
  })

  // Create Service Claim for w3
  const claim1 = await prisma.warrantyClaim.upsert({
    where: { claimNumber: 'CLM-77889900' },
    update: {},
    create: {
      shopId: shop.id,
      warrantyId: w3.id,
      claimNumber: 'CLM-77889900',
      status: 'UNDER_SERVICE',
      reportedIssue: 'Right bass radiator crackling sound at volumes above 60%',
      inspectionNotes: 'Inspected by Technician Sunil: driver suspension loose. Replaced internal driver component under seller warranty.',
      handledById: staffMember.id,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  // 8. Create Demo API Key for Colombo Tech Mart POS Integration
  const demoApiKey = 'ew_live_colombotech_demo_key_2024'
  const demoKeyHash = createHash('sha256').update(demoApiKey).digest('hex')
  await prisma.apiKey.upsert({
    where: { keyHash: demoKeyHash },
    update: {},
    create: {
      shopId: shop.id,
      name: 'Colombo Main POS Terminal',
      keyHash: demoKeyHash,
      prefix: 'ew_live_colombo...',
      permissions: ['pos:write', 'warranty:create'],
      createdById: shopOwner.id,
      isActive: true,
    },
  })

  // 9. Create Initial Audit Logs
  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      actorId: shopOwner.id,
      actorName: shopOwner.name,
      actorEmail: shopOwner.email,
      action: 'SHOP_CREATED',
      entityType: 'Shop',
      entityId: shop.id,
      metadata: { name: shop.name, currency: 'LKR' },
    },
  })

  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      actorId: shopOwner.id,
      actorName: shopOwner.name,
      actorEmail: shopOwner.email,
      action: 'WARRANTY_CREATED',
      entityType: 'Warranty',
      entityId: w1.id,
      metadata: { warrantyNumber: w1.warrantyNumber, customer: 'Dilshan Silva' },
    },
  })

  console.log('✅ Database successfully seeded with Sri Lankan SMB demo data!')
  console.log('───────────────────────────────────────────────────────')
  console.log('Demo Credentials:')
  console.log('Platform Super Admin: admin@ewarrant360.lk  /  AdminPass123!')
  console.log('Shop Owner:           kasun@colombotech.lk  /  SellerPass123!')
  console.log('Shop Staff:           nuwan@colombotech.lk  /  StaffPass123!')
  console.log('Sample Warranty:      EW360-7F4K92 (Token: vtok_7f4k92_demo_cryptotoken_srilanka_98721)')
  console.log('Demo POS API Key:     ew_live_colombotech_demo_key_2024')
  console.log('───────────────────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
