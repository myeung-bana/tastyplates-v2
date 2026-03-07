import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

export default function ArticleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="font-neusans">
      <Suspense fallback={<div></div>}>
        <Navbar />
        {children}
      </Suspense>
    </section>
  );
}
