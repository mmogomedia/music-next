import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  debug: false, // Disable debug to prevent warnings
  providers: [
    // Google OAuth (enabled when env vars are present)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Credentials fallback (email or username)
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier;
        const password = credentials?.password;
        if (!identifier || !password) return null;
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { name: identifier }],
          },
        });
        if (!user || !user.password) return null;

        // Check if user is active
        if (!user.isActive) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          isPremium: user.isPremium,
          isActive: user.isActive,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, check if user is active
      if (account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        // If user exists but is inactive, deny sign in
        if (dbUser && !dbUser.isActive) {
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error additional fields
        token.role = user.role;
        // @ts-expect-error additional fields
        token.isPremium = user.isPremium;
        // @ts-expect-error additional fields
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string | undefined;
        session.user.isPremium = token.isPremium as boolean | undefined;
        // @ts-expect-error additional field
        session.user.isActive = token.isActive as boolean | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
