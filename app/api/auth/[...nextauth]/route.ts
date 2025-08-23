import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/authOptions";

export const runtime = "nodejs";            // IMPORTANT: Prisma needs Node runtime
export const dynamic = "force-dynamic";     // Ensure this route is never cached/statized

console.log("=== NextAuth Route Initialization ===");
console.log("AuthOptions:", !!authOptions);
console.log("NextAuth import:", !!NextAuth);

let handler;
try {
  handler = NextAuth(authOptions);
  console.log("NextAuth handler created successfully");
} catch (error) {
  console.error("Error creating NextAuth handler:", error);
  throw error;
}

export { handler as GET, handler as POST };


