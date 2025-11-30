import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { 
  GET_RESTAURANT_BY_UUID, 
  GET_RESTAURANT_BY_SLUG_HASURA,
  GET_RESTAURANT_BY_UUID_WITH_PRICE_RANGE,
  GET_RESTAURANT_BY_SLUG_HASURA_WITH_PRICE_RANGE
} from '@/app/graphql/Restaurants/restaurantQueries';

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
    
    // Try with price range relationship first, fallback to basic query if it fails
    if (uuid) {
      // Validate UUID format
      if (!UUID_REGEX.test(uuid)) {
        return NextResponse.json(
          { error: 'Invalid UUID format' },
          { status: 400 }
        );
      }
      // Try with price range relationship
      result = await hasuraQuery(GET_RESTAURANT_BY_UUID_WITH_PRICE_RANGE, { uuid });
      
      // If error is related to price_range relationship, fallback to basic query
      if (result.errors) {
        const hasRelationshipError = result.errors.some((err: any) => 
          err.message?.includes('restaurant_price_range') || 
          err.message?.includes('price_range_id') ||
          err.message?.includes('field') && err.message?.includes('not found')
        );
        
        if (hasRelationshipError) {
          console.warn('Price range relationship not available, using basic query');
          result = await hasuraQuery(GET_RESTAURANT_BY_UUID, { uuid });
        }
      }
    } else if (slug) {
      // Try with price range relationship
      result = await hasuraQuery(GET_RESTAURANT_BY_SLUG_HASURA_WITH_PRICE_RANGE, { slug });
      
      // If error is related to price_range relationship, fallback to basic query
      if (result.errors) {
        const hasRelationshipError = result.errors.some((err: any) => 
          err.message?.includes('restaurant_price_range') || 
          err.message?.includes('price_range_id') ||
          err.message?.includes('field') && err.message?.includes('not found')
        );
        
        if (hasRelationshipError) {
          console.warn('Price range relationship not available, using basic query');
          result = await hasuraQuery(GET_RESTAURANT_BY_SLUG_HASURA, { slug });
        }
      }
    }

    if (result.errors) {
      console.error('GraphQL errors:', JSON.stringify(result.errors, null, 2));
      // Check if error is related to restaurant_price_range relationship
      const hasRelationshipError = result.errors.some((err: any) => 
        err.message?.includes('restaurant_price_range') || 
        err.message?.includes('price_range_id')
      );
      
      if (hasRelationshipError) {
        console.warn('Warning: restaurant_price_range relationship may not be configured in Hasura');
      }
      
      return NextResponse.json(
        {
          error: 'Failed to fetch restaurant',
          details: result.errors,
          message: result.errors[0]?.message || 'Unknown GraphQL error'
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

