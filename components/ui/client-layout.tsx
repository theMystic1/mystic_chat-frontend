"use client";

import { ReactNode } from "react";

import { ThemeToggle } from "./theme-toggle";
import Logo from "./logo";
import Image from "next/image";
import { IMAGES } from "@/utils/constants";
import { usePathname } from "next/navigation";

const ClientLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <main
      className={`relative min-h-screen w-full mx-auto  ${pathname.includes("/chat") ? "" : "flex flex-col lg:items-center justify-center"}  max-w-7xl px-5 lg:px-4 `}
    >
      <nav
        className={`${pathname.includes("/chat") ? "hidden" : "fixed"} top-0 right-0 left-0 shadow-2xs h-16 px-12  flex items-center justify-center gap-2 w-full z-50 bg-bg`}
      >
        <div className="flex  items-center justify-between w-full   max-w-7xl">
          <Logo />
          <ThemeToggle />
        </div>
      </nav>

      <div className="h-full">{children}</div>

      <footer className="fixed bottom-0 left-0 right-0  -z-20">
        <Image
          src={IMAGES.decoration}
          className="w-full lg:h-20 z-20"
          alt="Decoration image"
        />
      </footer>
    </main>
  );
};

export default ClientLayout;
