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
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { 
      console.log('=== JWT Callback Debug ===');
      console.log('User object:', user);
      console.log('Token before:', token);
      
      if (user) {
        // Cast user to our custom type and ensure all fields are set
        const customUser = user as CustomUser;
        (token as any).userId = customUser.id;
        (token as any).username = customUser.username;
        (token as any).email = customUser.email;
        (token as any).name = customUser.name;
        
        console.log('Token after:', token);
        console.log('User ID in token:', (token as any).userId);
      } else {
        console.log('❌ No user object in JWT callback!');
      }
      
      return token; 
    },
    async session({ session, token }) { 
      console.log('=== Session Callback Debug ===');
      console.log('Token:', token);
      console.log('Session before:', session);
      
      if ((token as any)?.userId) {
        // Ensure all user fields are properly set in the session
        (session.user as any) = {
          ...session.user,
          id: (token as any).userId,
          username: (token as any).username,
          email: (token as any).email,
          name: (token as any).name
        };
        
        console.log('Session after:', session);
        console.log('User ID in session:', (session.user as any).id);
      } else {
        console.log('❌ No userId in token!');
      }
      
      return session; 
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};


