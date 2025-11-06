import Hero from "@/components/Hero";
import Navbar from "@/components/layout/Navbar";
import ClientOnlyReviews from "@/components/review/ClientOnlyReviews";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"></div>}>
      <Navbar isLandingPage={true} />
      <div className="grid items-start justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full flex flex-col gap-8 items-center sm:items-start">
          <Hero />
          <ClientOnlyReviews/>
        </main>
      </div>
    </Suspense>
  );
}
