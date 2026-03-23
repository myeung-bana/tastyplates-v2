import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

/** Listing at /articles — search bar in navbar */
export default function ArticlesBrowseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={<div />}>
        <Navbar hasSearchBar />
      </Suspense>
      {children}
    </>
  );
}
