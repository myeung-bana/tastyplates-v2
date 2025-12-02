import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_PRICE_RANGES } from '@/app/graphql/PriceRanges/priceRangeQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Build where clause
    let where: any = {};

    // Search functionality
    if (search) {
      where._or = [
        { name: { _ilike: `%${search}%` } },
        { display_name: { _ilike: `%${search}%` } },
        { slug: { _ilike: `%${search}%` } }
      ];
    }

    const variables = {
      limit,
      offset,
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: { display_name: 'asc' } // Alphabetical by display_name
    };

    const result = await hasuraQuery(GET_ALL_PRICE_RANGES, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch price ranges',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const priceRanges = result.data?.restaurant_price_ranges || [];
    const total = result.data?.restaurant_price_ranges_aggregate?.aggregate?.count || priceRanges.length;

    return NextResponse.json({
      success: true,
      data: priceRanges,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Price Ranges API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

