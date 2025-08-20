"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("kam@matrix.local");
  const [password, setPassword] = useState("kamilek");
  const [error, setError] = useState("");
  const router = useRouter();
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.ok) router.push("/dashboard"); else setError("Invalid login");
  }
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded">
        <h1 className="text-2xl font-semibold">Matrix Sign In</h1>
        <input className="w-full border p-2 rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" /> 
        <input className="w-full border p-2 rounded" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full border p-2 rounded hover:bg-black hover:text-white">Sign In</button>
      </form>
    </div>
  );
}


