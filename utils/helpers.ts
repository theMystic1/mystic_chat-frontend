import { MessageRes } from "./types";

type DateLike = string | number | Date | null | undefined;

const toDate = (v: DateLike) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatChatDate = (value: DateLike) => {
  const d = toDate(value);
  if (!d) return "";

  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);

  return `${day} ${month} ${year}`;
};

export const formatChatTime = ({
  value,
  opts,
  type = "norms",
}: {
  value: DateLike;
  opts?: { hour12?: boolean; now?: Date };
  type?: "norms" | "time";
}) => {
  const d = toDate(value);
  if (!d) return "";

  const now = opts?.now ?? new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: opts?.hour12 ?? false,
  });

  if (type === "time") return time;
  if (isSameDay(d, now)) return time;

  if (isSameDay(d, yesterday)) return `Yesterday at ${time}`;

  return `${formatChatDate(d)}, ${time}`;
};

export const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .map((n) => n.split("")[0])
    .join("")
    .toUpperCase();

  return initials;
};

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatDayLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(d, now)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
