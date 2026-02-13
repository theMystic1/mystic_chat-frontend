"use client";

import * as React from "react";

type Option = { value: string; label: string; disabled?: boolean };

type MultiSelectDropdownProps = {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string[]; // selected values
  onChange: (next: string[]) => void;
  disabled?: boolean;
  maxTagCount?: number; // how many labels to show before "+N more"
  className?: string;
};

const MultiSelectDropdown = ({
  label,
  placeholder = "Select…",
  options,
  value,
  onChange,
  disabled,
  maxTagCount = 2,
  className,
}: MultiSelectDropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  const selected = React.useMemo(() => {
    const set = new Set(value.map(String));
    return options.filter((o) => set.has(String(o.value)));
  }, [options, value]);

  const toggle = (v: string) => {
    const s = new Set(value.map(String));
    if (s.has(String(v))) s.delete(String(v));
    else s.add(String(v));
    onChange(Array.from(s));
  };

  const clearAll = () => onChange([]);

  // close on outside click
  React.useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const summary = (() => {
    if (!selected.length) return placeholder;
    const names = selected.map((s) => s.label);
    if (names.length <= maxTagCount) return names.join(", ");
    return `${names.slice(0, maxTagCount).join(", ")} +${names.length - maxTagCount}`;
  })();

  return (
    <div
      ref={wrapRef}
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      {label ? (
        <label className="block mb-1 text-xs font-semibold text-ink-100">
          {label}
        </label>
      ) : null}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "input-wrap w-full flex items-center justify-between gap-2 rounded-lg px-3 py-3",
          "border border-white/10 bg-surface text-sm",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={selected.length ? "text-ink-100" : "text-muted truncate"}
        >
          {summary}
        </span>

        <span className="flex items-center gap-2">
          {selected.length ? (
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearAll();
              }}
              className="text-[11px] text-muted hover:text-ink-100 cursor-pointer"
              role="button"
              aria-label="Clear selection"
            >
              Clear
            </span>
          ) : null}
          <span className="text-muted">{open ? "▴" : "▾"}</span>
        </span>
      </button>

      {/* Popover */}
      {open ? (
        <div
          className={[
            "mt-2 w-full rounded-xl border border-white/10 bg-surface shadow-lg",
            "max-h-72 overflow-auto",
          ].join(" ")}
          role="listbox"
          aria-multiselectable="true"
        >
          <div className="p-2">
            {options.length === 0 ? (
              <div className="p-3 text-xs text-muted">No options</div>
            ) : (
              options.map((o) => {
                const checked = value.map(String).includes(String(o.value));
                return (
                  <label
                    key={o.value}
                    className={[
                      "flex items-center gap-2 px-2 py-2 rounded-lg",
                      o.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-white/5",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled || o.disabled}
                      onChange={() => toggle(o.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-ink-100 truncate">
                      {o.label}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MultiSelectDropdown;
