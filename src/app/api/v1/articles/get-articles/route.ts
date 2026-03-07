import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ARTICLES } from '@/app/graphql/Articles/articleQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const version = await getVersion('v:articles:all');
    const cacheKey = `articles:all:v${version}:limit=${limit}:offset=${offset}`;

    const { value: articles } = await cacheGetOrSetJSON(
      cacheKey,
      600,
      async () => {
        const result = await hasuraQuery(GET_ARTICLES, { limit, offset });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to fetch articles');
        }

        return result.data?.articles ?? [];
      }
    );

    return NextResponse.json({ success: true, data: articles });
  } catch (error) {
    console.error('[get-articles] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
