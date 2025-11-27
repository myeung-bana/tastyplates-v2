import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_PALATE_BY_ID } from '@/app/graphql/Taxonomies/palateQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Palate ID is required' },
        { status: 400 }
      );
    }

    const palateId = parseInt(id);
    if (isNaN(palateId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid palate ID' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_PALATE_BY_ID, { id: palateId });

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

    const palate = result.data?.restaurant_palates_by_pk;

    if (!palate) {
      return NextResponse.json(
        { success: false, error: 'Palate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: palate,
      meta: {
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Palate API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

