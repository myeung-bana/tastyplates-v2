import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_RESTAURANTS } from '@/app/graphql/Restaurants/restaurantQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Validate offset
    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be 0 or greater' },
        { status: 400 }
      );
    }

    // Build where clause
    // Default to "publish" status if not provided (for public-facing API)
    const statusFilter = status || 'publish';
    const where: any = {
      status: { _eq: statusFilter }
    };
    
    if (search) {
      // Combine status filter with search
      where._and = [
        { status: { _eq: statusFilter } },
        {
          _or: [
            { title: { _ilike: `%${search}%` } },
            { slug: { _ilike: `%${search}%` } },
            { listing_street: { _ilike: `%${search}%` } }
          ]
        }
      ];
    }

    const variables = {
      limit,
      offset,
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: { created_at: 'desc' }
    };

    console.log('🔍 Fetching restaurants with variables:', JSON.stringify(variables, null, 2));
    
    const result = await hasuraQuery(GET_ALL_RESTAURANTS, variables);

    if (result.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(result.errors, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to fetch restaurants',
          details: result.errors,
          message: result.errors[0]?.message || 'Unknown GraphQL error'
        },
        { status: 500 }
      );
    }

    console.log('✅ GraphQL response received:', {
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : [],
      restaurantCount: result.data?.restaurants?.length || 0
    });

    const restaurants = result.data?.restaurants || [];
    const total = result.data?.restaurants_aggregate?.aggregate?.count || restaurants.length;

    return NextResponse.json({
      data: restaurants,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Get Restaurants API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        error: 'Failed to fetch restaurants',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        hint: 'Check if the restaurants table exists and is tracked in Hasura'
      },
      { status: 500 }
    );
  }
}

