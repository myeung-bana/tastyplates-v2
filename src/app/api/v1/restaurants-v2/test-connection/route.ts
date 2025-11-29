import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';

/**
 * Diagnostic endpoint to test Hasura connection and table availability
 * This helps identify if the table name is correct
 */
export async function GET(request: NextRequest) {
  try {
    // Test query to check if restaurants table exists (correct name)
    const testQuery1 = `
      query TestRestaurants {
        restaurants(limit: 1) {
          id
          uuid
          title
        }
      }
    `;

    // Test query to check if restaurant_listings table exists (old name - for migration check)
    const testQuery2 = `
      query TestRestaurantListings {
        restaurant_listings(limit: 1) {
          id
          uuid
          title
        }
      }
    `;

    const results: any = {
      hasura_configured: !!process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL,
      hasura_url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL ? 'Set' : 'Not set',
      tests: {}
    };

    // Test restaurants (correct name)
    try {
      const result1 = await hasuraQuery(testQuery1, {});
      results.tests.restaurants = {
        exists: !result1.errors,
        error: result1.errors?.[0]?.message || null,
        hasData: !!result1.data?.restaurants,
        sampleCount: result1.data?.restaurants?.length || 0
      };
    } catch (error) {
      results.tests.restaurants = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test restaurant_listings (old name - for migration check)
    try {
      const result2 = await hasuraQuery(testQuery2, {});
      results.tests.restaurant_listings = {
        exists: !result2.errors,
        error: result2.errors?.[0]?.message || null,
        hasData: !!result2.data?.restaurant_listings,
        sampleCount: result2.data?.restaurant_listings?.length || 0
      };
    } catch (error) {
      results.tests.restaurant_listings = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        hasura_configured: !!process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL
      },
      { status: 500 }
    );
  }
}

