// app/actions/theme.ts
"use server";

import { cookies } from "next/headers";

export type ThemeValue = "light" | "dark" | "system";

export async function setThemeCookie(theme: ThemeValue) {
  const jar = await cookies();

  // Remove cookie so CSS falls back to prefers-color-scheme
  if (theme === "system") {
    jar.delete("theme");
    return;
  }

  jar.set("theme", theme, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
}
