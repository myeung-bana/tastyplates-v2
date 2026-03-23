import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

/** Article reader at /articles/[slug] — same chrome as legacy /article/[id] */
export default function ArticlesReadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={<div />}>
        <Navbar />
      </Suspense>
      {children}
    </>
  );
}
