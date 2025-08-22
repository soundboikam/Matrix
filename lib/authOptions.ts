import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { username: { label: "Username", type: "text" }, password: { label: "Password", type: "password" } },
      async authorize(creds) {
        if (!creds?.username || !creds.password) return null;
        
        // Search by username since we created the user with username field
        const user = await prisma.user.findUnique({ where: { username: creds.username } });
        
        if (!user) return null;
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        return ok ? { 
          id: user.id, 
          username: user.username,
          email: user.email, 
          name: user.name ?? null 
        } : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { 
      if (user) {
        (token as any).userId = user.id;
        (token as any).username = (user as any).username;
        (token as any).email = user.email;
        (token as any).name = user.name;
      }
      return token; 
    },
    async session({ session, token }) { 
      if ((token as any)?.userId) {
        (session.user as any) = {
          ...session.user,
          id: (token as any).userId,
          username: (token as any).username,
          email: (token as any).email,
          name: (token as any).name
        };
      }
      return session; 
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};


