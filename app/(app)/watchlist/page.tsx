// app/(app)/watchlist/page.tsx
import StarredGrid from "../../../components/StarredGrid";

export default function WatchlistPage() {
  return (
    <>
      <h1 className="h1 mb-4">Watchlist</h1>
      {/* Full grid of watchlisted artists using the same cards/modal as dashboard */}
      <StarredGrid full />
    </>
  );
}
