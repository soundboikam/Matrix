import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./authOptions";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  return session;
}


