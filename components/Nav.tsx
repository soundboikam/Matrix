"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMatrix from "./LogoMatrix";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import" },
  { href: "/data", label: "Data" },
  { href: "/outliers", label: "Outliers" },
  { href: "/artists", label: "Artists" },
  { href: "/watchlist", label: "Watchlist" },
];

export default function Nav() {
  const pathname = usePathname();
  const defaultDataType = process.env.NEXT_PUBLIC_DEFAULT_DATA_TYPE || "US";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand — bigger & visually separated */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 pr-6 mr-6 border-r border-zinc-800"
        >
          <LogoMatrix className="h-8 w-8" />
          <span className="text-2xl font-semibold tracking-wide text-white group-hover:opacity-90">
            Matrix
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {links.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors ${
                  active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          
          {/* Data Type Badge */}
          <div className="ml-4 px-2 py-1 text-xs bg-zinc-800/60 border border-zinc-700 rounded text-zinc-300">
            Data: {defaultDataType}
          </div>
        </nav>
      </div>
    </header>
  );
}


