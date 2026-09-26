import { describe, it, expect } from 'vitest'
import { registerSchema, warrantyCreateSchema, shopSchema } from '@/lib/validations'

describe('Zod Input Validation & Defensive Controls', () => {
  it('enforces password complexity and match', () => {
    // Weak password (no number or uppercase)
    const weak = registerSchema.safeParse({
      name: 'Kasun',
      email: 'kasun@test.com',
      password: 'password',
      confirmPassword: 'password',
    })
    expect(weak.success).toBe(false)

    // Passwords mismatch
    const mismatch = registerSchema.safeParse({
      name: 'Kasun',
      email: 'kasun@test.com',
      password: 'ValidPass123!',
      confirmPassword: 'DifferentPass123!',
    })
    expect(mismatch.success).toBe(false)

    // Strong password match
    const valid = registerSchema.safeParse({
      name: 'Kasun Perera',
      email: 'kasun@test.com',
      password: 'ValidPass123!',
      confirmPassword: 'ValidPass123!',
    })
    expect(valid.success).toBe(true)
  })

  it('validates Sri Lankan phone formats in shop settings', () => {
    const validLocal = shopSchema.safeParse({
      name: 'Tech Mart',
      email: 'shop@test.com',
      phone: '0771234567',
    })
    expect(validLocal.success).toBe(true)

    const validIntl = shopSchema.safeParse({
      name: 'Tech Mart',
      email: 'shop@test.com',
      phone: '+94771234567',
    })
    expect(validIntl.success).toBe(true)

    const invalid = shopSchema.safeParse({
      name: 'Tech Mart',
      email: 'shop@test.com',
      phone: '12345',
    })
    expect(invalid.success).toBe(false)
  })

  it('validates warranty creation date formats', () => {
    const valid = warrantyCreateSchema.safeParse({
      customerId: 'cust_123',
      productId: 'prod_456',
      purchaseDate: '2024-05-20',
      warrantyMonths: 12,
    })
    expect(valid.success).toBe(true)

    const invalidDate = warrantyCreateSchema.safeParse({
      customerId: 'cust_123',
      productId: 'prod_456',
      purchaseDate: 'not-a-date',
    })
    expect(invalidDate.success).toBe(false)
  })
})
