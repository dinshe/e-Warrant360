import { describe, it, expect } from 'vitest'
import {
  calculateWarrantyEndDate,
  isWarrantyExpired,
  daysUntilExpiry,
  formatLKR,
  maskPhone,
  maskEmail,
  maskSerial,
  slugify,
  generateWarrantyNumber,
} from '@/lib/utils'

describe('Warranty Business Calculations & Formatting', () => {
  it('correctly calculates warranty end dates over arbitrary month durations', () => {
    const start = new Date('2024-01-15T00:00:00Z')
    const end12M = calculateWarrantyEndDate(start, 12)
    expect(end12M.getFullYear()).toBe(2025)
    expect(end12M.getMonth()).toBe(0) // January
    expect(end12M.getDate()).toBe(15)

    const end24M = calculateWarrantyEndDate(start, 24)
    expect(end24M.getFullYear()).toBe(2026)

    const end60M = calculateWarrantyEndDate(start, 60)
    expect(end60M.getFullYear()).toBe(2029)
  })

  it('determines warranty expiration accurately', () => {
    const pastDate = new Date('2020-01-01')
    const futureDate = new Date('2035-01-01')
    expect(isWarrantyExpired(pastDate)).toBe(true)
    expect(isWarrantyExpired(futureDate)).toBe(false)
  })

  it('calculates days until expiry', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    const days = daysUntilExpiry(futureDate)
    expect(days).toBeGreaterThanOrEqual(9)
    expect(days).toBeLessThanOrEqual(11)
  })

  it('formats Sri Lankan Rupee (LKR) amounts correctly', () => {
    const formatted = formatLKR(185000)
    expect(formatted).toContain('185,000')
    expect(formatLKR(null)).toBe('—')
    expect(formatLKR(undefined)).toBe('—')
  })

  it('generates non-confusable human-readable warranty numbers', () => {
    const num = generateWarrantyNumber()
    expect(num).toMatch(/^EW360-[A-Z0-9]{6}$/)
    // Must NOT contain confusing letters 'O', 'I' or numbers '0', '1'
    expect(num).not.toContain('O')
    expect(num).not.toContain('I')
  })

  it('slugifies shop names into clean URLs', () => {
    expect(slugify('Colombo Tech Mart')).toBe('colombo-tech-mart')
    expect(slugify('Galle Sound & Vision (Pvt) Ltd.')).toBe('galle-sound-vision-pvt-ltd')
  })
})
