"use client";

import * as React from "react";
import Image from "next/image";
import { IMAGES } from "@/utils/constants";

type Props = {
  label?: string;
};

const AppLoader = ({ label = "Loading..." }: Props) => {
  return (
    <div className="relative min-h-[70vh] w-full flex items-center justify-center px-4">
      {/* ambient background */}
      <div className="absolute inset-0 ne opacity-55" />

      {/* soft aura behind the loader */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-70 w-70 -translate-x-1/2 -translate-y-1/2 rounded-full luxi-aura opacity-80" />
      </div>

      {/* Center loader (no phone/card framing) */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative h-16 w-16 luxi-float">
          <Image
            src={IMAGES.logo}
            alt="MystChat"
            fill
            priority
            className="object-contain"
          />
        </div>

        <p className="text-xs text-dim tracking-wide">{label}</p>

        {/* Progress */}
        <div className="w-45 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-[48%] bg-gold-gradient luxi-progress rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
