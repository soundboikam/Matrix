"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Redirect if already logged in
  useEffect(() => {
    if (status === "loading") return;
    if (session) {
      router.push("/");
    }
  }, [session, status, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render form if already logged in
  if (session) {
    return null;
  }
  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await signIn("credentials", { 
        redirect: false, 
        username, 
        password 
      });
      
      if (res?.ok) {
        router.push("/");
      } else {
        setError(`Login failed: ${res?.error || "Invalid username or password"}`);
      }
    } catch (error) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded">
        <h1 className="text-2xl font-semibold">Matrix Sign In</h1>
        <input 
          className="w-full border p-2 rounded" 
          value={username} 
          onChange={e=>setUsername(e.target.value)} 
          placeholder="Username" 
          required
          disabled={loading}
        /> 
        <input 
          className="w-full border p-2 rounded" 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          placeholder="Password" 
          required
          disabled={loading}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button 
          className="w-full border p-2 rounded hover:bg-black hover:text-white disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}


