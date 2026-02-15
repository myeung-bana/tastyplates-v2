/**
 * Nhost Server-Side Authentication Helper
 * 
 * Provides utilities for verifying Nhost JWT tokens on the server side.
 * This replaces Firebase Admin SDK token verification.
 */

export interface NhostTokenVerificationResult {
  success: boolean;
  userId?: string;
  user?: {
    id: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    emailVerified?: boolean;
    defaultRole?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}

/**
 * Verify Nhost access token and extract user information
 * 
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Verification result with user ID and user data
 * 
 * @example
 * const authHeader = request.headers.get('authorization');
 * const result = await verifyNhostToken(authHeader);
 * 
 * if (result.success) {
 *   console.log('User ID:', result.userId);
 *   console.log('User email:', result.user?.email);
 * } else {
 *   console.error('Verification failed:', result.error);
 * }
 */
export async function verifyNhostToken(
  authHeader: string | null
): Promise<NhostTokenVerificationResult> {
  if (!authHeader) {
    return {
      success: false,
      error: 'Missing authorization header'
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Invalid authorization header format. Expected: Bearer <token>'
    };
  }

  const accessToken = authHeader.replace('Bearer ', '');

  // Build Nhost Auth URL
  const nhostAuthUrl = process.env.NEXT_PUBLIC_NHOST_AUTH_URL || 
    `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.auth.${process.env.NEXT_PUBLIC_NHOST_REGION}.nhost.run`;

  if (!nhostAuthUrl) {
    return {
      success: false,
      error: 'Nhost configuration missing (NHOST_SUBDOMAIN or NHOST_REGION not set)'
    };
  }

  try {
    const response = await fetch(`${nhostAuthUrl}/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nhost token verification failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      return {
        success: false,
        error: response.status === 401 
          ? 'Invalid or expired token' 
          : `Token verification failed: ${response.statusText}`
      };
    }

    const nhostUser = await response.json();

    // Validate response has required user ID
    if (!nhostUser?.id) {
      return {
        success: false,
        error: 'Invalid user data returned from Nhost'
      };
    }

    return {
      success: true,
      userId: nhostUser.id,
      user: {
        id: nhostUser.id,
        email: nhostUser.email,
        displayName: nhostUser.displayName,
        avatarUrl: nhostUser.avatarUrl,
        emailVerified: nhostUser.emailVerified,
        defaultRole: nhostUser.defaultRole,
        metadata: nhostUser.metadata
      }
    };
  } catch (error) {
    console.error('Nhost token verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed'
    };
  }
}

/**
 * Extract user ID from Nhost token (convenience wrapper)
 * 
 * @param authHeader - Authorization header value
 * @returns User ID (UUID) or null if verification fails
 * 
 * @example
 * const userId = await getNhostUserId(authHeader);
 * if (!userId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getNhostUserId(authHeader: string | null): Promise<string | null> {
  const result = await verifyNhostToken(authHeader);
  return result.success ? result.userId! : null;
}
