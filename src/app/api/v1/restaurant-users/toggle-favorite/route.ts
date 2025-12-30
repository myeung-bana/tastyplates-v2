import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery, hasuraMutation } from '@/app/graphql/hasura-server-client';
import { 
  CHECK_USER_FAVORITE, 
  ADD_TO_FAVORITES, 
  REMOVE_FROM_FAVORITES,
  GET_RESTAURANT_UUID_BY_SLUG 
} from '@/app/graphql/RestaurantUsers/restaurantUserActionsQueries';
import { rateLimitOrThrow, wishlistRateLimit } from '@/lib/redis-ratelimit';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, restaurant_slug, restaurant_uuid } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    // Rate limiting: 15 requests / 10s per user
    const rateLimitResult = await rateLimitOrThrow(user_id, wishlistRateLimit);
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please slow down.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }

    // Get restaurant UUID from slug if provided
    let restaurantUuid = restaurant_uuid;
    if (!restaurantUuid && restaurant_slug) {
      const restaurantResult = await hasuraQuery(GET_RESTAURANT_UUID_BY_SLUG, { slug: restaurant_slug });
      if (restaurantResult.errors || !restaurantResult.data?.restaurants?.[0]) {
        return NextResponse.json(
          { success: false, error: 'Restaurant not found' },
          { status: 404 }
        );
      }
      restaurantUuid = restaurantResult.data.restaurants[0].uuid;
    }

    if (!restaurantUuid || !UUID_REGEX.test(restaurantUuid)) {
      return NextResponse.json(
        { success: false, error: 'Restaurant UUID or slug is required' },
        { status: 400 }
      );
    }

    // Check current favorite status
    const checkResult = await hasuraQuery(CHECK_USER_FAVORITE, {
      user_id,
      restaurant_uuid: restaurantUuid
    });

    if (checkResult.errors) {
      console.error('GraphQL errors:', checkResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: checkResult.errors[0]?.message || 'Failed to check favorite status',
          details: checkResult.errors
        },
        { status: 500 }
      );
    }

    const isFavorite = checkResult.data?.user_favorites?.length > 0;
    let result;

    if (isFavorite) {
      // Remove from favorites
      result = await hasuraMutation(REMOVE_FROM_FAVORITES, {
        user_id,
        restaurant_uuid: restaurantUuid
      });
    } else {
      // Add to favorites
      result = await hasuraMutation(ADD_TO_FAVORITES, {
        user_id,
        restaurant_uuid: restaurantUuid
      });
    }

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to toggle favorite',
          details: result.errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: isFavorite ? 'unsaved' : 'saved',
        restaurant_uuid: restaurantUuid
      }
    });

  } catch (error) {
    console.error('Toggle Favorite API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check favorite status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const restaurant_slug = searchParams.get('restaurant_slug');
    const restaurant_uuid = searchParams.get('restaurant_uuid');

    if (!user_id || !UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Valid user ID is required' },
        { status: 400 }
      );
    }

    // Get restaurant UUID
    let restaurantUuid = restaurant_uuid;
    if (!restaurantUuid && restaurant_slug) {
      const restaurantResult = await hasuraQuery(GET_RESTAURANT_UUID_BY_SLUG, { slug: restaurant_slug });
      if (restaurantResult.errors || !restaurantResult.data?.restaurants?.[0]) {
        return NextResponse.json(
          { success: false, error: 'Restaurant not found' },
          { status: 404 }
        );
      }
      restaurantUuid = restaurantResult.data.restaurants[0].uuid;
    }

    if (!restaurantUuid || !UUID_REGEX.test(restaurantUuid)) {
      return NextResponse.json(
        { success: false, error: 'Restaurant UUID or slug is required' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(CHECK_USER_FAVORITE, {
      user_id,
      restaurant_uuid: restaurantUuid
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to check favorite status',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const isFavorite = result.data?.user_favorites?.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        status: isFavorite ? 'saved' : 'unsaved',
        restaurant_uuid: restaurantUuid
      }
    });

  } catch (error) {
    console.error('Check Favorite API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

