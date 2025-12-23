import Navbar from '@/components/layout/Navbar';
import TastyStudioSidebar from '@/components/tastystudio/TastyStudioSidebar';
import { Suspense } from 'react';

export default function TastyStudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="min-h-screen bg-white">
      <Suspense fallback={<div></div>}>
        <Navbar />
      </Suspense>
      <div className="flex pt-16">
        <TastyStudioSidebar />
        <main className="flex-1 lg:ml-64">
          {children}
        </main>
      </div>
    </section>
  );
}

