import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_PRICE_RANGE_BY_ID } from '@/app/graphql/PriceRanges/priceRangeQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Price range ID is required' },
        { status: 400 }
      );
    }

    const priceRangeId = parseInt(id);
    if (isNaN(priceRangeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid price range ID format' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_PRICE_RANGE_BY_ID, { id: priceRangeId });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch price range',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const priceRange = result.data?.restaurant_price_ranges_by_pk;

    if (!priceRange) {
      return NextResponse.json(
        { success: false, error: 'Price range not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: priceRange,
      meta: {
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Price Range API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

