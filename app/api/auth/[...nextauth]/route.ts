import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/authOptions";

// Force Node runtime (Prisma needs Node, not Edge)
export const runtime = "nodejs";
// Prevent static optimization/caching
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

// Optional: tiny wrapper to log unexpected errors
function withErrorLogging(fn: any) {
  return async (req: Request, ctx: any) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      console.error("[NextAuth Route Error]", err);
      throw err;
    }
  };
}

export const GET = withErrorLogging(handler);
export const POST = withErrorLogging(handler);


