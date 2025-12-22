import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { CHECK_FOLLOW_STATUS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to initialize Firebase Admin if not already initialized
    const isInitialized = initializeFirebaseAdmin();
    
    if (!isInitialized) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace('Bearer ', '');
    
    // Verify Firebase token and get current user
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;

    // Get current user from Hasura using firebase_uuid
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const userResponse = await fetch(
      `${baseUrl}/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid=${encodeURIComponent(firebaseUid)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = await userResponse.json();
    if (!userData.success || !userData.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const followerId = userData.data.id; // Current user's UUID

    // Get userId from request body
    const body = await request.json();
    const userIdParam = body.user_id;

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Convert userId to string and validate UUID format
    const userIdStr = String(userIdParam);
    const isUUID = UUID_REGEX.test(userIdStr);
    
    if (!isUUID) {
      // If it's a numeric ID (legacy WordPress format), return false
      // The calling code should be updated to use UUIDs
      console.warn(`check-follow-status: Received numeric ID instead of UUID: ${userIdParam}. Returning false.`);
      return NextResponse.json({
        success: true,
        is_following: false
      });
    }
    
    const userId = userIdStr;

    // Prevent self-checks
    if (followerId === userId) {
      return NextResponse.json({
        success: true,
        is_following: false
      });
    }

    // Check if follow relationship exists
    const result = await hasuraQuery(CHECK_FOLLOW_STATUS, {
      followerId,
      userId
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      // If table doesn't exist, return false (not following)
      const hasTableError = result.errors.some((err: any) => 
        err.message?.includes('user_follows') || err.message?.includes('not found')
      );
      
      if (hasTableError) {
        return NextResponse.json({
          success: true,
          is_following: false
        });
      }
      
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Operation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    // Check if any follow relationship was found
    const follows = result.data?.user_follows || [];
    const isFollowing = follows.length > 0;

    return NextResponse.json({
      success: true,
      is_following: isFollowing
    });

  } catch (error) {
    console.error('Check Follow Status API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
