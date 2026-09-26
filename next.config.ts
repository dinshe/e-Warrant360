import type { NextConfig } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
const allowedOrigins = ['localhost:3000']
if (appUrl) {
  try {
    const host = new URL(appUrl).host
    if (!allowedOrigins.includes(host)) {
      allowedOrigins.push(host)
    }
  } catch {
    // If not a valid URL, ignore
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
