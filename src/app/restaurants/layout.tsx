import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";
import { generateMetadata as generateSEOMetadata, siteConfig } from "@/lib/seo";
import type { Metadata } from "next";

// Restaurants listing page metadata
export const metadata: Metadata = generateSEOMetadata({
  title: "Discover Restaurants",
  description: "Explore amazing restaurants and discover the perfect meal that fits your taste. Browse reviews, photos, and ratings from the TastyPlates community.",
  canonical: `${siteConfig.url}/restaurants`,
  type: "website",
  tags: ["restaurants", "dining", "food discovery", "restaurant reviews", "cuisine"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <Suspense fallback={<div></div>}>
        <Navbar hasSearchBar hasSearchBarMobile />
        {children}
      </Suspense>
    </section>
  );
}