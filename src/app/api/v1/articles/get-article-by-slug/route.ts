import { NextRequest, NextResponse } from 'next/server';
import { cacheGetOrSetJSONNonNull } from '@/lib/redis-cache';
import {
  fetchArticleBySlug,
  normalizeArticleSlugParam,
} from '@/lib/articles/fetchArticleBySlug';

function slugifyCacheKey(slug: string): string {
  return encodeURIComponent(slug).slice(0, 200);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('slug') ?? '';
    const slug = normalizeArticleSlugParam(raw);

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'slug query parameter is required' },
        { status: 400 }
      );
    }

    const cacheKey = `articles:by-slug:${slugifyCacheKey(slug)}`;

    const { value: article, hit } = await cacheGetOrSetJSONNonNull(
      cacheKey,
      600,
      async () => fetchArticleBySlug(raw)
    );

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
      meta: { cached: hit, slugResolved: slug },
    });
  } catch (error) {
    console.error('[get-article-by-slug] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
