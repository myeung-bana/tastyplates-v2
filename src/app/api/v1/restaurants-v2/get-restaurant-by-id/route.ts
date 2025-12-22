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
      
      // If error is related to price_range relationship or any field not found, fallback to basic query
      if (result.errors) {
        const hasRelationshipError = result.errors.some((err: any) => 
          err.message?.includes('restaurant_price_range') || 
          err.message?.includes('price_range_id') ||
          (err.message?.includes('field') && err.message?.includes('not found')) ||
          err.message?.includes('Cannot query field')
        );
        
        if (hasRelationshipError) {
          console.warn('Relationship or field not available, using basic query');
          result = await hasuraQuery(GET_RESTAURANT_BY_UUID, { uuid });
          
          // If basic query also has errors, check if it's a non-critical field error
          if (result.errors) {
            const hasCriticalError = result.errors.some((err: any) => 
              !err.message?.includes('field') && !err.message?.includes('not found') &&
              !err.message?.includes('Cannot query field')
            );
            
            // Only fail if it's a critical error, not a missing field error
            if (hasCriticalError) {
              // Let it fall through to error handling below
            } else {
              // Clear non-critical field errors and continue
              console.warn('Non-critical field errors detected, continuing with available data');
              result.errors = [];
            }
          }
        }
      }
    } else if (slug) {
      // Try with price range relationship
      result = await hasuraQuery(GET_RESTAURANT_BY_SLUG_HASURA_WITH_PRICE_RANGE, { slug });
      
      // If error is related to price_range relationship or any field not found, fallback to basic query
      if (result.errors) {
        const hasRelationshipError = result.errors.some((err: any) => 
          err.message?.includes('restaurant_price_range') || 
          err.message?.includes('price_range_id') ||
          (err.message?.includes('field') && err.message?.includes('not found')) ||
          err.message?.includes('Cannot query field')
        );
        
        if (hasRelationshipError) {
          console.warn('Relationship or field not available, using basic query');
          result = await hasuraQuery(GET_RESTAURANT_BY_SLUG_HASURA, { slug });
          
          // If basic query also has errors, check if it's a non-critical field error
          if (result.errors) {
            const hasCriticalError = result.errors.some((err: any) => 
              !err.message?.includes('field') && !err.message?.includes('not found') &&
              !err.message?.includes('Cannot query field')
            );
            
            // Only fail if it's a critical error, not a missing field error
            if (hasCriticalError) {
              // Let it fall through to error handling below
            } else {
              // Clear non-critical field errors and continue
              console.warn('Non-critical field errors detected, continuing with available data');
              result.errors = [];
            }
          }
        }
      }
    }

    if (result.errors && result.errors.length > 0) {
      // Filter out non-critical field errors
      const criticalErrors = result.errors.filter((err: any) => 
        !err.message?.includes('field') || 
        !err.message?.includes('not found') ||
        !err.message?.includes('Cannot query field')
      );
      
      // If there are only non-critical field errors, log warning but continue
      if (criticalErrors.length === 0) {
        console.warn('Non-critical GraphQL field errors detected, returning available data:', result.errors);
        // Continue to return restaurant data even with field errors
      } else {
        // Only return error if there are critical errors
        console.error('Critical GraphQL errors:', JSON.stringify(criticalErrors, null, 2));
        return NextResponse.json(
          {
            error: 'Failed to fetch restaurant',
            details: criticalErrors,
            message: criticalErrors[0]?.message || 'Unknown GraphQL error'
          },
          { status: 500 }
        );
      }
    }

    const restaurant = result.data?.restaurants?.[0];

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

