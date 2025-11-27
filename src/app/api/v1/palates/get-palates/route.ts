import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_PALATES } from '@/app/graphql/Taxonomies/palateQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const parentOnly = searchParams.get('parentOnly') === 'true';
    const parentIdParam = searchParams.get('parentId');

    // Build where clause
    let where: any = {};

    // Filter by parent
    if (parentOnly) {
      where.parent_id = { _is_null: true };
    } else if (parentIdParam !== null && parentIdParam !== undefined) {
      if (parentIdParam === 'null') {
        where.parent_id = { _is_null: true };
      } else {
        const parentId = parseInt(parentIdParam);
        if (!isNaN(parentId)) {
          where.parent_id = { _eq: parentId };
        }
      }
    }

    // Search functionality
    if (search) {
      where._or = [
        { name: { _ilike: `%${search}%` } },
        { slug: { _ilike: `%${search}%` } }
      ];
    }

    const variables = {
      limit,
      offset,
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: { name: 'asc' } // Alphabetical by default
    };

    const result = await hasuraQuery(GET_ALL_PALATES, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch palates',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const palates = result.data?.restaurant_palates || [];
    const total = result.data?.restaurant_palates_aggregate?.aggregate?.count || palates.length;

    return NextResponse.json({
      success: true,
      data: palates,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Palates API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

