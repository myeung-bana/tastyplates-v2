// Nhost Client Configuration
import { NhostClient } from '@nhost/nextjs';

/**
 * Nhost client instance for authentication and data access
 * 
 * Configuration:
 * - Subdomain: ygmkmxorcapgpimwerpc
 * - Region: ap-southeast-1 (Singapore)
 * - Auth URL: https://ygmkmxorcapgpimwerpc.auth.ap-southeast-1.nhost.run
 * - Hasura URL: https://ygmkmxorcapgpimwerpc.hasura.ap-southeast-1.nhost.run
 */
export const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'ygmkmxorcapgpimwerpc',
  region: process.env.NEXT_PUBLIC_NHOST_REGION || 'ap-southeast-1',
});

// Export auth, graphql, and storage clients for convenience
export const { auth, graphql, storage } = nhost;
