import { describe, it, expect } from 'vitest'
import { maskPhone, maskEmail, maskSerial } from '@/lib/utils'

describe('Security & Privacy: Data Masking on Public Verification', () => {
  it('partially masks customer phone numbers', () => {
    expect(maskPhone('0771234567')).toBe('077****67')
    expect(maskPhone('+94719876543')).toBe('+94****43')
    expect(maskPhone('')).toBe('***')
  })

  it('partially masks customer email addresses', () => {
    expect(maskEmail('kasun@colombotech.lk')).toBe('ka***@colombotech.lk')
    expect(maskEmail('customer.name@gmail.com')).toBe('cu***@gmail.com')
    expect(maskEmail('invalid')).toBe('***')
  })

  it('partially masks hardware unit serial numbers', () => {
    expect(maskSerial('SN-SAM55-8849102')).toBe('SN-***102')
    expect(maskSerial('UA55CU7000-XYZ')).toBe('UA5***XYZ')
    expect(maskSerial('12')).toBe('***')
  })
})
