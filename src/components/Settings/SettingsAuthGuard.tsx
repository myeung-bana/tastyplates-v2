"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticationStatus } from '@nhost/nextjs';

/**
 * Client-side auth guard for all /settings/* routes.
 * Redirects unauthenticated users to the homepage.
 * Keeps the settings layout itself as a Server Component.
 */
export default function SettingsAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff7c0a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Returning null here while redirect is in-flight prevents a flash of content
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
