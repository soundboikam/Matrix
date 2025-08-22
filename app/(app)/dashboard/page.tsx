import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../../lib/auth";
import StarredGrid from "../../../components/StarredGrid";
import StatsCards from "../../../components/StatsCards";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = (session as any).user?.id as string;

  const membership = await prisma.membership.findFirst({ where: { userId } });
  const workspaceId = membership?.workspaceId ?? "";

  // latest 15 stars for the Watchlist box (simple table)
  const latestStars = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { starredAt: "desc" },
    take: 15,
    include: { artist: true },
  });

  return (
    <>
      <StatsCards />

      {/* Starred cards / Rising grid FIRST */}
      <section className="mt-8">
        <StarredGrid />
      </section>

      {/* Watchlist table AFTER cards */}
      <section className="mt-8 rounded border border-neutral-800 bg-[#0b0b0b]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="h2">Watchlist (latest 15)</h2>
          <Link
            href="/watchlist"
            className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-200 hover:border-neutral-500"
          >
            View full watchlist
          </Link>
        </div>
        <div className="border-t border-neutral-800">
          <table className="w-full">
            <thead>
              <tr>
                <th>Artist</th>
                <th className="text-right">Starred</th>
              </tr>
            </thead>
            <tbody>
              {latestStars.map((w) => (
                <tr key={w.id}>
                  <td>{w.artist.name}</td>
                  <td className="text-right">{w.starredAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
              {latestStars.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-sm text-neutral-400">
                    No watchlist yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

