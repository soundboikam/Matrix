"use client";
import { ReactNode, useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
  width = 720,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  title?: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-800 bg-[#0b0b0b] shadow-2xl"
        style={{ width, maxWidth: "95vw" }}
      >
        <div className="flex items-center justify-between border-b border-white/5 p-3">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded border border-white/10 px-2 py-1 text-sm hover:border-white/20">
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}


