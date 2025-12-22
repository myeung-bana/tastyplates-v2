import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { CHECK_FOLLOW_STATUS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { auth } from '@/lib/firebase-admin';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
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
