import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import Auth0Provider from 'next-auth/providers/auth0'
import { prisma } from './prisma'

export const nextAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID ?? 'stub-client-id',
      clientSecret: process.env.AUTH0_CLIENT_SECRET ?? 'stub-client-secret',
      issuer: process.env.AUTH0_ISSUER,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.role = (token.role as string) ?? 'DEVELOPER'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'DEVELOPER'
      }
      return token
    },
  },
}

export type SessionWithRole = {
  user: {
    id: string
    email?: string | null
    name?: string | null
    role: string
  }
}
