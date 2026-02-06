"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;

  children?: React.ReactNode;

  footer?: React.ReactNode;

  maxWidthClassName?: string; // e.g. "max-w-md", "max-w-xl"
  className?: string; // optional extra classes for panel
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
};

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-md",
  className = "",
  closeOnBackdrop = true,
  closeOnEsc = true,
}: ModalProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open || !closeOnEsc) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  React.useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  if (!open || !mounted) return null;

  const node = (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onMouseDown={onBackdrop}
      />

      <div
        className={[
          "relative w-full card",
          maxWidthClassName,
          "border border-white/10",
          className,
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="min-w-full">
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            {description ? (
              <p className="text-sm text-muted mt-1 ">{description}</p>
            ) : null}
          </div>

          {/* <div>
            <button
              type="button"
              onClick={onClose}
              className="h-6 w-6 items-center justify-center text-center rounded-full btn-ghost px-3 py-2 text-xs shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div> */}
        </div>

        {children ? <div className="mt-5">{children}</div> : null}

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export default Modal;
