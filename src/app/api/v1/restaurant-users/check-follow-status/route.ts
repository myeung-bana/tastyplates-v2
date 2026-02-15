import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { CHECK_FOLLOW_STATUS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { verifyNhostToken } from '@/lib/nhost-server-auth';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    // Verify Nhost token and get user ID directly
    const authHeader = request.headers.get('Authorization');
    const tokenResult = await verifyNhostToken(authHeader);
    
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error || 'Authorization token required' },
        { status: 401 }
      );
    }

    const followerId = tokenResult.userId!; // Current user's UUID

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
        err.message?.includes('restaurant_user_follows') || err.message?.includes('not found')
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
    const follows = result.data?.restaurant_user_follows || [];
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
