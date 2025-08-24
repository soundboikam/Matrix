import "../../app/globals.css";
import Link from "next/link";
import Nav from "../../components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Remove server-side session check - let client-side handle it
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}


