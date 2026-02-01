import Hero from "@/components/Hero";
import Navbar from "@/components/layout/Navbar";
import ClientOnlyReviews from "@/components/review/ClientOnlyReviews";
import Discover from "@/components/Discover";
import { Suspense } from "react";
import { generateMetadata as generateSEOMetadata, siteConfig } from "@/lib/seo";
import type { Metadata } from "next";

// Homepage metadata
export const metadata: Metadata = generateSEOMetadata({
  title: "Discover Amazing Food Experiences",
  description: "Discover the meal that fits your taste. Dine like a Brazilian in Tokyo - or Korean in New York? Find and share amazing food experiences with TastyPlates.",
  canonical: siteConfig.url,
  type: "website",
  tags: ["food reviews", "restaurant reviews", "food discovery", "dining", "cuisine", "food experiences"],
});

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"></div>}>
      <Navbar isLandingPage={true} />
      <div className="grid items-start justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full flex flex-col gap-8 items-center sm:items-start">
          <Hero />
          <ClientOnlyReviews/>
          <Discover />
        </main>
      </div>
    </Suspense>
  );
}
