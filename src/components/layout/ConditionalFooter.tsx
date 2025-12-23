'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on TastyStudio pages
  if (pathname?.startsWith('/tastystudio')) {
    return null;
  }
  
  return <Footer />;
}

