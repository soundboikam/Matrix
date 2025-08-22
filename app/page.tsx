import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/authOptions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Show simple landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Matrix</h1>
        <p className="text-xl text-gray-600">A&R Intelligence Platform</p>
        <Link 
          href="/login" 
          className="inline-block bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}


