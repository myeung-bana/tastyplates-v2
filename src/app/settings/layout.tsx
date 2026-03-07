import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";
import SettingsAuthGuard from "@/components/Settings/SettingsAuthGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="font-neusans">
      <Suspense fallback={<div></div>}>
        <Navbar hasSearchBar />
        <SettingsAuthGuard>
          {children}
        </SettingsAuthGuard>
      </Suspense>
    </section>
  );
}
