"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <html>
      <body style={{ background: "#0b0b0b", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 720, margin: "20vh auto 0", padding: 24, border: "1px solid #222", borderRadius: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Something broke</h1>
          <p style={{ color: "#aaa", marginBottom: 16 }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{ padding: "8px 12px", border: "1px solid #333", background: "#111", color: "white", borderRadius: 6 }}
          >
            Try again
          </button>
          {error.digest ? <div style={{ marginTop: 12, color: "#666" }}>Digest: {error.digest}</div> : null}
        </div>
      </body>
    </html>
  );
}


