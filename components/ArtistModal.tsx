"use client";

import React from "react";
import ArtistChart from "./ArtistChart";

type Point = { weekStart: string; streams: number };
type SeriesResp = {
  points: Point[];
  regionUsed: "US" | "Global" | "mixed";
  availableRegions: string[];
  hasMixedRegionsInResult: boolean;
  error?: string;
};

export default function ArtistModal({
  artist,
  onClose,
}: {
  artist: { id: string; name: string };
  onClose: () => void;
}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [points, setPoints] = React.useState<Point[]>([]);
  const [availableRegions, setAvailableRegions] = React.useState<string[]>([]);
  const [region, setRegion] = React.useState<"US" | "Global">("US");
  const [regionUsed, setRegionUsed] = React.useState<"US" | "Global" | "mixed">(
    "US"
  );

  const load = React.useCallback(
    async (desired?: "US" | "Global") => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/artist/${artist.id}/series${
          desired ? `?region=${desired}` : ""
        }`;
        const res = await fetch(url);
        const data: SeriesResp = await res.json();
        if (data.error) {
          setPoints([]);
          setAvailableRegions(data.availableRegions || []);
          setRegionUsed(data.regionUsed);
          setError(data.error);
          return;
        }
        
        setPoints(data.points || []);
        setRegionUsed(data.regionUsed);
        setAvailableRegions(data.availableRegions || []);

        // Decide region to show by default
        if (!desired) {
          if (data.regionUsed === "US" || data.regionUsed === "Global") {
            setRegion(data.regionUsed);
          } else {
            // mixed -> pick US if exists else Global
            if (data.availableRegions.includes("US")) setRegion("US");
            else if (data.availableRegions.includes("Global")) setRegion("Global");
          }
        }
      } catch (e: any) {
        setError(e.message || "Failed");
      } finally {
        setLoading(false);
      }
    },
    [artist.id]
  );

  React.useEffect(() => {
    load(); // initial auto
  }, [load]);

  React.useEffect(() => {
    // reload when user switches region tab
    load(region);
  }, [region, load]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg">{artist.name}</h2>

            {/* Region tabs if both exist */}
            {availableRegions.includes("US") && availableRegions.includes("Global") && (
              <div className="flex items-center gap-2 ml-4">
                {["US", "Global"].map((r) =>
                  availableRegions.includes(r) ? (
                    <button
                      key={r}
                      onClick={() => setRegion(r as "US" | "Global")}
                      className={`px-2 py-1 rounded text-xs border ${
                        region === r
                          ? "border-emerald-400 text-emerald-300"
                          : "border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {r}
                    </button>
                  ) : null
                )}
              </div>
            )}
          </div>
          <button
            className="text-sm text-zinc-300 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Warning/notice */}
        <div className="px-4 pt-3">
          {availableRegions.includes("US") &&
            availableRegions.includes("Global") && (
              <div className="mb-3 text-xs text-amber-300">
                This artist has both <b>US</b> and <b>Global</b> data. You’re
                viewing <b>{region}</b>. Switch tabs to compare.
              </div>
            )}
        </div>

        <div className="p-4">
          {loading && <div className="text-zinc-400">Loading...</div>}
          {error && <div className="text-red-400">{error}</div>}
          {!loading && !error && points.length === 0 && (
            <div className="text-zinc-400">No data.</div>
          )}
          {!loading && !error && points.length > 0 && (
            <ArtistChart 
              data={points.map(p => ({
                date: p.weekStart,
                streams: p.streams
              }))} 
            />
          )}
        </div>
      </div>
    </div>
  );
}


