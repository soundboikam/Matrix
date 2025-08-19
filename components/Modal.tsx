"use client";
import { useEffect } from "react";

export default function Modal({
  open, onClose, children, title,
}: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-3xl rounded border border-neutral-800 bg-[#0b0b0b] text-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-800 p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-sm text-neutral-400 hover:text-white" onClick={onClose}>Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}


