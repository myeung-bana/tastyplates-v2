import Navbar from "@/components/Navbar";
import { Suspense } from "react";

export default function FollowingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <Suspense fallback={<div></div>}>
        <Navbar hasSearchBar />
        {children}
      </Suspense>
    </section>
  );
}
