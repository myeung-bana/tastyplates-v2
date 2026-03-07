import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ARTICLE_BY_ID } from '@/app/graphql/Articles/articleQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam || isNaN(Number(idParam))) {
      return NextResponse.json(
        { success: false, error: 'A valid numeric id is required' },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);
    const cacheKey = `articles:by-id:${id}`;

    const { value: article } = await cacheGetOrSetJSON(
      cacheKey,
      600,
      async () => {
        const result = await hasuraQuery(GET_ARTICLE_BY_ID, { id });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to fetch article');
        }

        return result.data?.articles_by_pk ?? null;
      }
    );

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    console.error('[get-article-by-id] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
