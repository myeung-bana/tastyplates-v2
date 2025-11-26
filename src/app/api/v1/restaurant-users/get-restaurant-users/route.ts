import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_RESTAURANT_USERS } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const firebase_uuid = searchParams.get('firebase_uuid');
    const email = searchParams.get('email');
    const username = searchParams.get('username');
    const include_deleted = searchParams.get('include_deleted') === 'true';

    // Build where clause
    let where: any = {};
    
    // Exclude deleted users by default
    if (!include_deleted) {
      where.deleted_at = { _is_null: true };
    }

    // Search across multiple fields
    if (search) {
      where._or = [
        { username: { _ilike: `%${search}%` } },
        { email: { _ilike: `%${search}%` } },
        { display_name: { _ilike: `%${search}%` } },
        { firebase_uuid: { _ilike: `%${search}%` } }
      ];
    }

    // Specific filters
    if (firebase_uuid) {
      where.firebase_uuid = { _eq: firebase_uuid };
    }
    if (email) {
      where.email = { _eq: email };
    }
    if (username) {
      where.username = { _eq: username };
    }

    const variables = {
      limit,
      offset,
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: { created_at: 'desc' }
    };

    const result = await hasuraQuery(GET_ALL_RESTAURANT_USERS, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch users', 
          details: result.errors 
        },
        { status: 500 }
      );
    }

    const users = result.data?.restaurant_users || [];
    const total = result.data?.restaurant_users_aggregate?.aggregate?.count || users.length;

    return NextResponse.json({
      success: true,
      data: users,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Restaurant Users API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

