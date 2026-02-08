"use client";

import { useEffect } from "react";

export function ProfileModalShell({
  open,
  onClose,
  title,
  rightAction,
  children,
  widthClass = "w-[420px] max-w-[92vw]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rightAction?: React.ReactNode; // e.g. Save button or nothing
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* sheet */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className={[
            widthClass,
            "rounded-3xl overflow-hidden border border-white/10 bg-surface shadow-2xl",
          ].join(" ")}
        >
          {/* header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-surface">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost px-2.5 py-2 text-xs"
              >
                ✕
              </button>
              <p className=" text-xs font-semibold w-full">{title}</p>
            </div>

            <div className="shrink-0">{rightAction}</div>
          </div>

          {/* content */}
          <div className="max-h-[72vh] overflow-y-auto no-scrollbar p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
