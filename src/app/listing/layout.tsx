import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar isLandingPage={false} />
        {children}
        <Footer />
      </Suspense>
    </section>
  );
}