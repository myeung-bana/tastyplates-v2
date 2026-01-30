import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_FAVORITES, GET_RESTAURANTS_BY_UUIDS } from '@/app/graphql/RestaurantUsers/restaurantUserActionsQueries';
import { transformRestaurantV2ToRestaurant } from '@/utils/restaurantTransformers';
import { RestaurantV2 } from '@/app/api/v1/services/restaurantV2Service';
import { GRAPHQL_LIMITS } from '@/constants/graphql';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(user_id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid user ID format. Expected UUID, got: "${user_id}"` 
        },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_USER_FAVORITES, {
      user_id,
      limit,
      offset
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch wishlist',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const favorites = result.data?.user_favorites || [];
    const total = result.data?.user_favorites_aggregate?.aggregate?.count || 0;

    if (favorites.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      });
    }

    // Extract restaurant UUIDs
    const restaurantUuids = favorites
      .map((favorite: any) => favorite.restaurant_uuid)
      .filter((uuid: string) => uuid);

    if (restaurantUuids.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      });
    }

    // Fetch restaurant data by UUIDs
    const restaurantsResult = await hasuraQuery(GET_RESTAURANTS_BY_UUIDS, {
      uuids: restaurantUuids,
      limit: GRAPHQL_LIMITS.BATCH_RESTAURANTS_MAX
    });

    if (restaurantsResult.errors) {
      console.error('GraphQL errors fetching restaurants:', restaurantsResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: restaurantsResult.errors[0]?.message || 'Failed to fetch restaurants',
          details: restaurantsResult.errors
        },
        { status: 500 }
      );
    }

    const restaurants = restaurantsResult.data?.restaurants || [];
    
    // Create a map of restaurant UUID to restaurant data for quick lookup
    const restaurantMap = new Map(
      restaurants.map((r: any) => [r.uuid, r])
    );

    // Transform restaurant data to match RestaurantCard interface
    const transformedData = favorites
      .map((favorite: any) => {
        const restaurant = restaurantMap.get(favorite.restaurant_uuid);
        if (!restaurant) return null;

        // Transform RestaurantV2 format to Restaurant format
        const restaurantV2: RestaurantV2 = {
          id: restaurant.id || 0,
          uuid: restaurant.uuid,
          title: restaurant.title,
          slug: restaurant.slug,
          status: restaurant.status,
          average_rating: restaurant.average_rating || 0,
          ratings_count: restaurant.ratings_count || 0,
          price_range: restaurant.restaurant_price_range?.display_name || '',
          featured_image_url: restaurant.featured_image_url,
          address: restaurant.address,
          listing_street: restaurant.listing_street || restaurant.address?.street_address || '',
          cuisines: restaurant.cuisines,
          palates: restaurant.palates,
          created_at: '',
          updated_at: ''
        };

        return {
          favorite_id: favorite.id,
          created_at: favorite.created_at,
          restaurant: transformRestaurantV2ToRestaurant(restaurantV2)
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Get Wishlist API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

