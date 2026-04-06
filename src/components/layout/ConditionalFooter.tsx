"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import MobileLegalStrip from "./MobileLegalStrip";

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/tastystudio")) {
    return null;
  }

  return (
    <>
      <Footer />
      <MobileLegalStrip />
    </>
  );
}

