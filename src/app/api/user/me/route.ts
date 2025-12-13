import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK
 * Returns true if initialized successfully, false otherwise
 */
function initializeFirebaseAdmin(): boolean {
  // Check if already initialized
  if (getApps().length > 0) {
    return true;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    // Check for required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('Firebase Admin SDK: FIREBASE_PROJECT_ID is not set');
      return false;
    }
    
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Firebase Admin SDK: FIREBASE_CLIENT_EMAIL is not set');
      return false;
    }
    
    if (!privateKey) {
      console.error('Firebase Admin SDK: FIREBASE_PRIVATE_KEY is not set or invalid');
      return false;
    }
    
    // Initialize Firebase Admin
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return false;
  }
}

// Try to initialize on module load
initializeFirebaseAdmin();

/**
 * GET /api/user/me
 * 
 * Fetches the current authenticated user's data from Hasura
 * Uses Firebase ID token from Authorization header or Firebase session cookie
 * 
 * Returns:
 * - 200: User data successfully fetched
 * - 401: Not authenticated
 * - 404: User not found in Hasura
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Try to initialize Firebase Admin if not already initialized
    const isInitialized = initializeFirebaseAdmin();
    
    if (!isInitialized) {
      console.error('Firebase Admin SDK not initialized - check environment variables');
      const missingVars = [];
      if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
      if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication service unavailable',
          message: missingVars.length > 0 
            ? `Missing environment variables: ${missingVars.join(', ')}`
            : 'Firebase Admin SDK initialization failed. Check server logs for details.'
        },
        { status: 500 }
      );
    }

    const auth = getAuth();
    let firebaseUid: string | null = null;

    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
      } catch (error) {
        console.error('Failed to verify ID token:', error);
      }
    }

    // If no Authorization header, try session cookie
    if (!firebaseUid) {
      const sessionCookie = request.cookies.get('__session')?.value;
      if (sessionCookie) {
        try {
          const decodedToken = await auth.verifySessionCookie(sessionCookie);
          firebaseUid = decodedToken.uid;
        } catch (error) {
          console.error('Failed to verify session cookie:', error);
        }
      }
    }

    // If still no Firebase UID, user is not authenticated
    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user from Hasura using firebase_uuid via /api/v1 route
    try {
      // Get base URL from environment variable or fallback to request origin
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      
      // Construct absolute URL to call /api/v1/restaurant-users route
      const apiUrl = `${baseUrl}/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid=${encodeURIComponent(firebaseUid)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        
        if (status === 404) {
          return NextResponse.json(
            { success: false, error: 'User not found', message: 'User account does not exist in database' },
            { status: 404 }
          );
        }
        
        throw new Error(errorData.error || `Failed to fetch user: ${response.statusText}`);
      }

      const userResponse = await response.json();
      
      if (!userResponse.success || !userResponse.data) {
        return NextResponse.json(
          { success: false, error: 'User not found', message: 'User account does not exist in database' },
          { status: 404 }
        );
      }

      // Return user data
      return NextResponse.json({
        success: true,
        data: userResponse.data,
      });
    } catch (error: any) {
      console.error('Error fetching user from Hasura:', error);
      
      // Check if it's a 404 error
      if (error.status === 404 || error.message?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'User not found', message: 'User account does not exist in database' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data', message: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in /api/user/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
