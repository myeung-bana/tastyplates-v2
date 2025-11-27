import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_CUISINE_BY_ID } from '@/app/graphql/Taxonomies/cuisineQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Cuisine ID is required' },
        { status: 400 }
      );
    }

    const cuisineId = parseInt(id);
    if (isNaN(cuisineId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cuisine ID' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_CUISINE_BY_ID, { id: cuisineId });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Operation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const cuisine = result.data?.restaurant_cuisines_by_pk;

    if (!cuisine) {
      return NextResponse.json(
        { success: false, error: 'Cuisine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cuisine,
      meta: {
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Cuisine API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

