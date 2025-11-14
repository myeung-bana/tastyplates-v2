import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <Suspense fallback={<div></div>}>
        <Navbar isLandingPage={false} />
        {children}
      </Suspense>
    </section>
  );
}