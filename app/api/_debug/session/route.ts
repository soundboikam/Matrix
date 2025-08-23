import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return new Response(
      JSON.stringify({ ok: true, session }, null, 2),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("[/api/_debug/session] error", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
