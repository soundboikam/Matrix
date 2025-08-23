import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Define the custom user type that includes username
interface CustomUser {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  // (Auth.js v5 uses trustHost; harmless on v4)
  // @ts-expect-error
  trustHost: true,
  
  session: {
    strategy: "jwt", // or "database" if you explicitly need DB sessions
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { username: { label: "Username", type: "text" }, password: { label: "Password", type: "password" } },
      async authorize(creds) {
        try {
          console.log('=== Authorize Function Called ===');
          console.log('Credentials received:', { username: creds?.username, password: creds?.password ? '[REDACTED]' : 'missing' });
          
          if (!creds?.username || !creds.password) {
            console.log('❌ Missing credentials');
            return null;
          }
          
          // Search by username since we created the user with username field
          const user = await prisma.user.findUnique({ where: { username: creds.username } });
          console.log('User found:', user ? { id: user.id, username: user.username, hasPassword: !!user.passwordHash } : 'NOT FOUND');
          
          if (!user) {
            console.log('❌ User not found');
            return null;
          }
          
          const ok = await bcrypt.compare(creds.password, user.passwordHash);
          console.log('Password comparison result:', ok);
          
          if (!ok) {
            console.log('❌ Password incorrect');
            return null;
          }
          
          // Return user object with all necessary fields
          const userToReturn = { 
            id: user.id, 
            username: user.username,
            email: user.email, 
            name: user.name ?? null 
          };
          console.log('✅ Returning user:', userToReturn);
          return userToReturn;
        } catch (err) {
          console.error("[NextAuth authorize error]", err);
          return null; // never throw
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.sub = (user as any).id ?? token.sub ?? null;
          // If you store role/permissions, copy them only if present
          (token as any).role = (user as any).role ?? (token as any).role ?? null;
          (token as any).username =
            (user as any).username ?? (token as any).username ?? null;
          (token as any).email = (user as any).email ?? (token as any).email ?? null;
          (token as any).name = (user as any).name ?? (token as any).name ?? null;
        }
        return token;
      } catch (err) {
        console.error("[NextAuth jwt callback error]", err);
        return token; // never throw
      }
    },

    async session({ session, token }) {
      try {
        if (session.user) {
          (session.user as any).id = token.sub ?? null;
          (session.user as any).role = (token as any).role ?? null;
          (session.user as any).username = (token as any).username ?? null;
          (session.user as any).email = (token as any).email ?? null;
          (session.user as any).name = (token as any).name ?? null;
        }
        return session;
      } catch (err) {
        console.error("[NextAuth session callback error]", err);
        return session; // never throw
      }
    },

    async signIn(params) {
      try {
        // If you validate anything here (e.g., require workspace), handle the "missing" case gracefully.
        return true;
      } catch (err) {
        console.error("[NextAuth signIn callback error]", err);
        return false;
      }
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  
  cookies: {
    // Let NextAuth set secure cookies in prod; avoid custom domain
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};


