"use client";

import * as React from "react";

type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

const base = "inline-flex items-center leading-none";

const Tick = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={`h-3.5 w-3.5 ${className}`}
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6.3 11.2 3.6 8.6l1-1 1.7 1.7L11.4 4.2l1 1-6.1 6z"
      fill="currentColor"
    />
  </svg>
);

const DoubleTick = ({ className = "" }: { className?: string }) => (
  <span className={`${base} relative`}>
    <Tick className={`opacity-90 ${className}`} />
    <Tick className={`-ml-2.5 ${className}`} />
  </span>
);

const Clock = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={`h-3.5 w-3.5 ${className}`}
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 1.6a6.4 6.4 0 1 0 0 12.8A6.4 6.4 0 0 0 8 1.6Zm0 1.2a5.2 5.2 0 1 1 0 10.4A5.2 5.2 0 0 1 8 2.8Z"
      fill="currentColor"
    />
    <path d="M8.6 4.2H7.4v4l2.8 1.6.6-1-2.2-1.2V4.2Z" fill="currentColor" />
  </svg>
);

export default function Checkmarks({ status }: { status: DeliveryStatus }) {
  // WhatsApp mapping:
  // sending = clock
  // sent = single tick (server accepted)
  // delivered = double tick (recipient got it)
  // read = double tick + green/blue (recipient read)
  if (status === "sending") return <Clock className="text-black/70" />;

  if (status === "sent") return <Tick className="text-black/70" />;

  if (status === "delivered") return <DoubleTick className="text-black/70" />;

  // ✅ read
  return <DoubleTick className="text-white" />;
}
