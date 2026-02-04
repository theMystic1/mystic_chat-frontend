"use client";

import { IMAGES } from "@/utils/constants";
import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 ">
      <div className="relative h-10 w-10">
        <Image src={IMAGES.logo} alt="Logo image" />
      </div>

      <p>MystChat</p>
    </Link>
  );
};

export default Logo;
