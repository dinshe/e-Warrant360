import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'e-warrant360 — Digital Warranty Management',
    template: '%s | e-warrant360',
  },
  description: 'Secure, fast digital warranty management for Sri Lankan businesses',
  keywords: ['warranty', 'management', 'Sri Lanka', 'e-warrant360', 'digital warranty'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
