import { describe, it, expect } from 'vitest'
import { canTransition } from '@/lib/services/warranty.service'
import { WarrantyStatus } from '@prisma/client'

describe('Warranty State Machine & Transition Rules', () => {
  it('allows valid lifecycle transitions from ACTIVE', () => {
    expect(canTransition('ACTIVE', 'CLAIMED')).toBe(true)
    expect(canTransition('ACTIVE', 'EXPIRED')).toBe(true)
    expect(canTransition('ACTIVE', 'VOIDED')).toBe(true)
    expect(canTransition('ACTIVE', 'TRANSFERRED')).toBe(true)
  })

  it('allows valid lifecycle transitions through service claim flow', () => {
    expect(canTransition('CLAIMED', 'UNDER_SERVICE')).toBe(true)
    expect(canTransition('CLAIMED', 'REJECTED')).toBe(true)
    expect(canTransition('UNDER_SERVICE', 'REPAIRED')).toBe(true)
    expect(canTransition('UNDER_SERVICE', 'REPLACED')).toBe(true)
    expect(canTransition('REPAIRED', 'COMPLETED')).toBe(true)
    expect(canTransition('REPLACED', 'COMPLETED')).toBe(true)
  })

  it('rejects illegal status transitions', () => {
    // Cannot jump from DRAFT straight to COMPLETED or REPAIRED
    expect(canTransition('DRAFT', 'COMPLETED')).toBe(false)
    expect(canTransition('DRAFT', 'REPAIRED')).toBe(false)

    // Cannot jump from ACTIVE straight to REPAIRED without being CLAIMED or UNDER_SERVICE
    expect(canTransition('ACTIVE', 'REPAIRED')).toBe(false)

    // COMPLETED, EXPIRED, VOIDED are terminal states
    expect(canTransition('COMPLETED', 'ACTIVE')).toBe(false)
    expect(canTransition('EXPIRED', 'CLAIMED')).toBe(false)
    expect(canTransition('VOIDED', 'ACTIVE')).toBe(false)
  })
})
