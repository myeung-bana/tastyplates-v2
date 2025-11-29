import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_RESTAURANT_BY_UUID, GET_RESTAURANT_BY_SLUG_HASURA } from '@/app/graphql/Restaurants/restaurantQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const slug = searchParams.get('slug'); // Support slug for backward compatibility

    if (!uuid && !slug) {
      return NextResponse.json(
        { error: 'Restaurant UUID or slug is required' },
        { status: 400 }
      );
    }

    let result;
    
    if (uuid) {
      // Validate UUID format
      if (!UUID_REGEX.test(uuid)) {
        return NextResponse.json(
          { error: 'Invalid UUID format' },
          { status: 400 }
        );
      }
      result = await hasuraQuery(GET_RESTAURANT_BY_UUID, { uuid });
    } else if (slug) {
      result = await hasuraQuery(GET_RESTAURANT_BY_SLUG_HASURA, { slug });
    }

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          error: 'Failed to fetch restaurant',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const restaurant = uuid 
      ? result.data?.restaurants_by_pk
      : result.data?.restaurants?.[0];

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: restaurant,
      meta: {
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get Restaurant API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

