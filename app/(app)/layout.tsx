import "../../app/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/authOptions";
import Nav from "../../components/Nav";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Check if user has any workspace memberships
  if (!(session.user as any)?.id) {
    redirect("/login");
  }

  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}


