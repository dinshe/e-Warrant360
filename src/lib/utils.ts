import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { randomBytes } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

export function generateWarrantyNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No O,0,I,1 confusion
  const bytes = randomBytes(6)
  let result = 'EW360-'
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export function generateClaimNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let result = 'CLM-'
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-2)
}

export function maskEmail(email: string): string {
  if (!email.includes('@')) return '***'
  const [local, domain] = email.split('@')
  return local.slice(0, 2) + '***@' + domain
}

export function maskSerial(serial: string): string {
  if (!serial || serial.length < 4) return '***'
  return serial.slice(0, 3) + '***' + serial.slice(-3)
}

export function calculateWarrantyEndDate(startDate: Date, months: number): Date {
  const end = new Date(startDate)
  end.setMonth(end.getMonth() + months)
  return end
}

export function formatLKR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Colombo',
  }).format(new Date(date))
}

export function isWarrantyExpired(endDate: Date | string): boolean {
  return new Date(endDate) < new Date()
}

export function daysUntilExpiry(endDate: Date | string): number {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
