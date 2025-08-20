"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="ml-2 inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700"
      title="Log out"
      aria-label="Log out"
    >
      Log out
    </button>
  );
}
