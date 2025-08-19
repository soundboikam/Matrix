"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUploadButton({ uploadId }: { uploadId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function doDelete() {
    if (busy) return;
    setErr(null);
    if (!confirm("Delete this import and all its rows? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      // Re-fetch the server component table after deletion
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {err && <span className="text-xs text-rose-400">{err}</span>}
      <button
        onClick={doDelete}
        disabled={busy}
        className="rounded border border-rose-700/40 bg-rose-900/20 px-3 py-1 text-sm text-rose-200 hover:border-rose-600/60 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}


