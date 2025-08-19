"use client";
import { useState } from "react";

export default function StarButton({
  artistId,
  initialStarred,
  size = "sm",
  onToggle,
}: {
  artistId: string;
  initialStarred: boolean;
  size?: "sm" | "md";
  onToggle?: (starred: boolean) => void;
}) {
  const [starred, setStarred] = useState<boolean>(initialStarred);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !starred;
    setStarred(next); // optimistic
    onToggle?.(next);

    try {
      const res = await fetch("/api/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, star: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setStarred(Boolean(json?.starred));
      onToggle?.(Boolean(json?.starred));
    } catch {
      setStarred(!next); // revert on error
      onToggle?.(!next);
    } finally {
      setBusy(false);
    }
  }

  const clsBase =
    "inline-flex items-center justify-center rounded border transition-colors";
  const clsSize = size === "md" ? "h-9 w-9 text-lg" : "h-8 w-8 text-base";
  const cls =
    clsBase +
    " " +
    clsSize +
    " " +
    (starred
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : "border-white/10 bg-transparent text-neutral-300 hover:border-white/20");

  return (
    <button
      type="button"
      aria-pressed={starred}
      title={starred ? "Remove from watchlist" : "Add to watchlist"}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      disabled={busy}
      className={cls}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}


