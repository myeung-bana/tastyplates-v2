declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  interface PWAConfig {
    dest: string;
    register: boolean;
    skipWaiting: boolean;
  }
  
  const withPWA: (config: PWAConfig) => (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
