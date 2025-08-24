import StarredGrid from "../../../components/StarredGrid";
import StatsCards from "../../../components/StatsCards";
import Link from "next/link";

export default async function DashboardPage() {
  // Remove server-side auth check - let client-side handle it
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
          <div className="p-6 text-center text-sm text-neutral-400">
            Watchlist data will load here
          </div>
        </div>
      </section>
    </>
  );
}