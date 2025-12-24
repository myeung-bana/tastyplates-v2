import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_FOLLOWERS_COUNT } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid user ID format. Expected UUID, got: "${userId}"` 
        },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_FOLLOWERS_COUNT, { userId });

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

    const count = result.data?.restaurant_user_follows_aggregate?.aggregate?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        userId,
        followersCount: count
      }
    });

  } catch (error) {
    console.error('Get Followers Count API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

