import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery, hasuraMutation } from '@/app/graphql/hasura-server-client';
import { 
  CHECK_USER_CHECKIN, 
  ADD_CHECKIN, 
  REMOVE_CHECKIN,
  GET_RESTAURANT_UUID_BY_SLUG 
} from '@/app/graphql/RestaurantUsers/restaurantUserActionsQueries';

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

    // Check current check-in status
    const checkResult = await hasuraQuery(CHECK_USER_CHECKIN, {
      user_id,
      restaurant_uuid: restaurantUuid
    });

    if (checkResult.errors) {
      console.error('GraphQL errors:', checkResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: checkResult.errors[0]?.message || 'Failed to check check-in status',
          details: checkResult.errors
        },
        { status: 500 }
      );
    }

    const isCheckedIn = checkResult.data?.user_checkins?.length > 0;
    let result;

    if (isCheckedIn) {
      // Remove check-in
      result = await hasuraMutation(REMOVE_CHECKIN, {
        user_id,
        restaurant_uuid: restaurantUuid
      });
    } else {
      // Add check-in
      result = await hasuraMutation(ADD_CHECKIN, {
        user_id,
        restaurant_uuid: restaurantUuid
      });
    }

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to toggle check-in',
          details: result.errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: isCheckedIn ? 'uncheckedin' : 'checkedin',
        restaurant_uuid: restaurantUuid
      }
    });

  } catch (error) {
    console.error('Toggle Check-in API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check check-in status
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

    const result = await hasuraQuery(CHECK_USER_CHECKIN, {
      user_id,
      restaurant_uuid: restaurantUuid
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to check check-in status',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const isCheckedIn = result.data?.user_checkins?.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        status: isCheckedIn ? 'checkedin' : 'uncheckedin',
        restaurant_uuid: restaurantUuid
      }
    });

  } catch (error) {
    console.error('Check Check-in API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

