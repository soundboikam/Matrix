import "../../app/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/authOptions";
import Nav from "../../components/Nav";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  console.log('=== App Layout Debug ===');
  console.log('Session received:', session);
  console.log('Session user:', session?.user);
  console.log('User ID:', (session?.user as any)?.id);
  console.log('Username:', (session?.user as any)?.username);
  
  // Redirect to login if not authenticated
  if (!session) {
    console.log('❌ No session - redirecting to /login');
    redirect("/login");
  }

  // Check if user has any workspace memberships (or a valid ID)
  if (!(session.user as any)?.id) { // Cast to any to access custom 'id'
    console.log('❌ No user ID in session - redirecting to /login');
    redirect("/login");
  }

  console.log('✅ Session valid - rendering app layout');
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}


