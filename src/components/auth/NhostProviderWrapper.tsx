'use client';

import { NhostProvider } from '@nhost/nextjs';
import { nhost } from '@/lib/nhost';
import { ReactNode } from 'react';

interface NhostProviderWrapperProps {
  children: ReactNode;
}

/**
 * Client-side wrapper for Nhost Provider.
 * Only wraps with NhostProvider when nhost client exists (browser); during build nhost is null.
 */
export default function NhostProviderWrapper({ children }: NhostProviderWrapperProps) {
  if (!nhost) {
    return <>{children}</>;
  }
  return <NhostProvider nhost={nhost}>{children}</NhostProvider>;
}
