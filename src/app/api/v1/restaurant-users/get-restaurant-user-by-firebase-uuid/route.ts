import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_RESTAURANT_USER_BY_FIREBASE_UUID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebase_uuid = searchParams.get('firebase_uuid');

    if (!firebase_uuid) {
      return NextResponse.json(
        { success: false, error: 'Firebase UUID is required' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_RESTAURANT_USER_BY_FIREBASE_UUID, { firebase_uuid });

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

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get Restaurant User by Firebase UUID API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

