import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { UserRole } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.isActive) {
          return null
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatch) {
          // Log failed login attempt
          await prisma.auditLog.create({
            data: {
              action: 'LOGIN_FAILED',
              entityType: 'User',
              entityId: user.id,
              details: { email, reason: 'Invalid password' },
            },
          })
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // Log successful login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            entityType: 'User',
            entityId: user.id,
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
})

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface User {
    role: UserRole
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }
}

// Helper to check if user has required role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

// Role hierarchy for checking permissions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  LOCATION_ADMIN: 4,
  BOOKING_ADMIN: 3,
  MEMBER: 2,
  GUEST: 1,
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}
