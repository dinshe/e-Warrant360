import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      shopId: string | null
      shopSlug: string | null
      shopName: string | null
      role: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | null
      isPlatformAdmin: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    isPlatformAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    isPlatformAdmin?: boolean
    shopId?: string | null
    shopSlug?: string | null
    shopName?: string | null
    role?: 'PLATFORM_ADMIN' | 'OWNER' | 'ADMIN' | 'STAFF' | null
  }
}
