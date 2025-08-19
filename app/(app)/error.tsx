"use client";

export default function AppGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <div className="rounded border border-neutral-800 bg-[#0b0b0b] p-6 text-white">
      <h2 className="text-lg font-semibold">Page error</h2>
      <p className="mt-2 text-sm text-neutral-400">{error.message || "Unexpected error."}</p>
      <button className="btn mt-4" onClick={() => reset()}>Retry</button>
    </div>
  );
}


