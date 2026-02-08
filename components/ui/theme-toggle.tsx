// components/ThemeToggle.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setThemeCookie, ThemeValue } from "@/utils/action";
import DarkModeTwoToneIcon from "@mui/icons-material/DarkModeTwoTone";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
import SettingsSystemDaydreamTwoToneIcon from "@mui/icons-material/SettingsSystemDaydreamTwoTone";
import Cookies from "js-cookie";

export function ThemeToggle() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [theme, setTheme] = React.useState(Cookies.get("theme"));

  function onSelect(theme: ThemeValue) {
    startTransition(async () => {
      await setThemeCookie(theme);
      router.refresh(); // re-renders layout with updated cookie -> updates data-theme
    });
  }

  return (
    <div className="inline-flex items-center border border-ink-100 rounded-lg gap-2">
      <button
        className="btn-theme"
        disabled={pending}
        onClick={() => onSelect("light")}
        type="button"
      >
        <WbSunnyTwoToneIcon fontSize="small" />
      </button>
      <button
        className="btn-theme"
        disabled={pending}
        onClick={() => onSelect("dark")}
        type="button"
      >
        <DarkModeTwoToneIcon fontSize="small" />
      </button>
      <button
        className="btn-theme"
        disabled={pending}
        onClick={() => onSelect("system")}
        type="button"
      >
        <SettingsSystemDaydreamTwoToneIcon fontSize="small" />
      </button>
    </div>
  );
}
