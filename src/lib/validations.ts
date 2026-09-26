import { z } from 'zod'

const SRI_LANKA_PHONE = /^(\+94|0)[0-9]{9}$/

export const registerBaseSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
})

export const registerSchema = registerBaseSchema.refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

export const shopSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  email: z.string().email().trim(),
  phone: z
    .string()
    .regex(SRI_LANKA_PHONE, 'Invalid Sri Lankan phone')
    .optional()
    .or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  district: z.string().optional(),
  province: z
    .enum([
      'WESTERN',
      'CENTRAL',
      'SOUTHERN',
      'NORTHERN',
      'EASTERN',
      'NORTH_WESTERN',
      'NORTH_CENTRAL',
      'UVA',
      'SABARAGAMUWA',
    ])
    .optional(),
  businessRegNumber: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
})

export const productSchema = z.object({
  name: z.string().min(1).max(300).trim(),
  brand: z.string().max(200).optional().or(z.literal('')),
  categoryId: z.string().optional().nullable(),
  modelNumber: z.string().max(200).optional().or(z.literal('')),
  sku: z.string().max(100).optional().or(z.literal('')),
  barcode: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  requiresSerialNumber: z.boolean().default(false),
  purchaseCost: z.number().positive().optional().nullable(),
  sellingPrice: z.number().positive().optional().nullable(),
  defaultWarrantyMonths: z.number().int().min(0).max(600).default(12),
  warrantyType: z
    .enum(['MANUFACTURER', 'SELLER', 'EXTENDED', 'LIMITED', 'LIFETIME', 'CUSTOM'])
    .default('SELLER'),
  warrantyTerms: z.string().max(5000).optional().or(z.literal('')),
  warrantyExclusions: z.string().max(5000).optional().or(z.literal('')),
})

export const customerSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(SRI_LANKA_PHONE, 'Invalid Sri Lankan phone')
    .optional()
    .or(z.literal('')),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  district: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const warrantyCreateSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  serialNumber: z.string().max(200).optional().or(z.literal('')),
  invoiceNumber: z.string().max(200).optional().or(z.literal('')),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  warrantyStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  warrantyMonths: z.number().int().min(1).max(600).optional(),
  warrantyType: z
    .enum(['MANUFACTURER', 'SELLER', 'EXTENDED', 'LIMITED', 'LIFETIME', 'CUSTOM'])
    .optional(),
  purchasePrice: z.number().positive().optional().nullable(),
  terms: z.string().max(5000).optional().or(z.literal('')),
  exclusions: z.string().max(5000).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  idempotencyKey: z.string().uuid().optional(),
})

export const claimCreateSchema = z.object({
  warrantyId: z.string().min(1),
  reportedIssue: z.string().min(10).max(2000).trim(),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const claimUpdateSchema = z.object({
  status: z.enum([
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'UNDER_SERVICE',
    'REPAIRED',
    'REPLACED',
    'COMPLETED',
    'CLOSED',
  ]),
  inspectionNotes: z.string().max(2000).optional().or(z.literal('')),
  repairNotes: z.string().max(2000).optional().or(z.literal('')),
  rejectionReason: z.string().max(2000).optional().or(z.literal('')),
  replacementInfo: z.string().max(2000).optional().or(z.literal('')),
  note: z.string().max(1000).optional().or(z.literal('')),
})

export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
