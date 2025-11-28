import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_RESTAURANT_USERS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

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

    // Check if username exists in Hasura
    const where = {
      username: { _eq: username },
      deleted_at: { _is_null: true } // Only check non-deleted users
    };

    const result = await hasuraQuery(GET_ALL_RESTAURANT_USERS, {
      where,
      limit: 1
    });

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
    const exists = users.length > 0;

    return NextResponse.json({
      success: true,
      exists,
      message: exists 
        ? 'Sorry, this username already exists.' 
        : 'Username is available.',
      status: 200
    });

  } catch (error) {
    console.error('Check Username API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

