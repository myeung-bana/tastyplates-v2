import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation, hasuraQuery } from '@/app/graphql/hasura-server-client';
import { UNFOLLOW_USER, GET_FOLLOWERS_COUNT, GET_FOLLOWING_COUNT } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initializeFirebaseAdmin(): boolean {
  if (getApps().length > 0) return true;
  
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      return false;
    }
    
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
    const isInitialized = initializeFirebaseAdmin();
    if (!isInitialized) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace('Bearer ', '');
    let decodedToken;
    try {
      const auth = getAuth();
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const userResponse = await fetch(
      `${baseUrl}/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid=${encodeURIComponent(firebaseUid)}`
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

    const followerId = userData.data.id;
    const body = await request.json();
    const userIdParam = body.user_id;

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIdStr = String(userIdParam);
    if (!UUID_REGEX.test(userIdStr)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    const userId = userIdStr;

    if (followerId === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot unfollow yourself' },
        { status: 400 }
      );
    }

    // Delete follow relationship
    const result = await hasuraMutation(UNFOLLOW_USER, {
      followerId,
      userId
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to unfollow user',
          details: result.errors
        },
        { status: 500 }
      );
    }

    if (result.data?.delete_restaurant_user_follows?.affected_rows === 0) {
      return NextResponse.json(
        { success: false, error: 'Not following this user' },
        { status: 400 }
      );
    }

    // Get updated counts
    const [followersCountResult, followingCountResult] = await Promise.all([
      hasuraQuery(GET_FOLLOWERS_COUNT, { userId }),
      hasuraQuery(GET_FOLLOWING_COUNT, { userId: followerId })
    ]);

    const followersCount = followersCountResult.data?.restaurant_user_follows_aggregate?.aggregate?.count || 0;
    const followingCount = followingCountResult.data?.restaurant_user_follows_aggregate?.aggregate?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        result: 'unfollowed',
        followers: followersCount,
        following: followingCount
      }
    });

  } catch (error) {
    console.error('Unfollow User API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

