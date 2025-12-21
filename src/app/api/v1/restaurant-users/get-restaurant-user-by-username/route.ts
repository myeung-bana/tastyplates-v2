import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_RESTAURANT_USER_BY_USERNAME } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format (basic check - alphanumeric, underscore, hyphen, dots)
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid username format. Username can only contain letters, numbers, dots, underscores, and hyphens.` 
        },
        { status: 400 }
      );
    }

    // Query user by username
    const result = await hasuraQuery(GET_RESTAURANT_USER_BY_USERNAME, { username });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Operation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const users = result.data?.restaurant_users || [];
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate follower and following counts (default to 0 if relationships don't exist)
    let followersCount = 0;
    let followingCount = 0;
    
    try {
      // Count followers array (users who follow this user)
      if (Array.isArray(user.followers)) {
        followersCount = user.followers.length;
      }
      
      // Count following array (users this user is following)
      if (Array.isArray(user.following)) {
        followingCount = user.following.length;
      }
    } catch (error) {
      // If relationships don't exist, counts remain 0
      console.warn('Could not get follower/following counts, defaulting to 0:', error);
    }

    // Remove relationship arrays from user object before returning (we only need counts)
    const { followers, following, ...userData } = user;

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        followers_count: followersCount,
        following_count: followingCount
      }
    });

  } catch (error) {
    console.error('Get Restaurant User by Username API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
