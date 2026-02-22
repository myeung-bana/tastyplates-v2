// Nhost Client Configuration
import { NhostClient } from '@nhost/nextjs';

/**
 * Nhost client instance for authentication and data access.
 * Only created in the browser so the build (Node) does not run "Could not find the Nhost auth client".
 *
 * Configuration:
 * - Subdomain: ygmkmxorcapgpimwerpc
 * - Region: ap-southeast-1 (Singapore)
 * - Auth URL: https://ygmkmxorcapgpimwerpc.auth.ap-southeast-1.nhost.run
 * - Hasura URL: https://ygmkmxorcapgpimwerpc.hasura.ap-southeast-1.nhost.run
 */
const isClient = typeof window !== 'undefined';

export const nhost = isClient
  ? new NhostClient({
      subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'ygmkmxorcapgpimwerpc',
      region: process.env.NEXT_PUBLIC_NHOST_REGION || 'ap-southeast-1',
    })
  : null;

// Export auth, graphql, and storage for convenience (null on server so build does not throw)
export const auth = nhost?.auth ?? null;
export const graphql = nhost?.graphql ?? null;
export const storage = nhost?.storage ?? null;
