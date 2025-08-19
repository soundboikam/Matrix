import Link from "next/link";
import StarredGrid from "../components/StarredGrid";

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">Starred Artists</h1>
        <Link href="/watchlist" className="muted text-sm hover:underline">
          View all →
        </Link>
      </div>
      <StarredGrid />
    </div>
  );
}


