"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('=== Login Form Submitted ===');
    console.log('Username:', username);
    console.log('Password:', password ? '[REDACTED]' : 'missing');
    
    setLoading(true);
    setError("");
    
    try {
      console.log('Calling signIn...');
      const res = await signIn("credentials", { 
        username, 
        password,
        redirect: true, // Use NextAuth's built-in redirect
        callbackUrl: "/dashboard" // Redirect directly to dashboard
      });
      
      console.log('signIn result:', res);
      
      // If we get here, there was an error (NextAuth handles successful redirect)
      if (res?.error) {
        console.log('❌ SignIn error:', res.error);
        setError(`Login failed: ${res.error}`);
      }
    } catch (error) {
      console.log('❌ Exception during signIn:', error);
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


