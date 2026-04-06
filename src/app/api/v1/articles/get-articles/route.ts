import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import {
  GET_ARTICLES,
  GET_ARTICLES_FALLBACK,
  GET_ARTICLES_FOR_LOCATIONS,
  GET_ARTICLES_FOR_LOCATIONS_FALLBACK,
  GET_RESTAURANT_LOCATION_BY_SLUG,
  GET_CHILD_RESTAURANT_LOCATION_IDS,
} from '@/app/graphql/Articles/articleQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

type RestaurantLocationRow = {
  id: number;
  type: string;
  slug: string;
  parent_id?: number | null;
};

type ArticleRow = { id: number } & Record<string, unknown>;

type ArticlesPayload = { articles: ArticleRow[]; hasMore: boolean };

/** Max rows pulled per bucket when merging city + country (pagination slices in memory). */
const MERGE_FETCH_CAP = 160;

async function resolveCountryScopeIds(countryLocationId: number): Promise<number[]> {
  const children = await hasuraQuery<{ restaurant_locations: { id: number }[] }>(
    GET_CHILD_RESTAURANT_LOCATION_IDS,
    { parentId: countryLocationId }
  );

  if (children.errors?.length) {
    console.warn('[get-articles] child locations:', children.errors[0]?.message);
    return [countryLocationId];
  }

  const childIds = children.data?.restaurant_locations?.map((r) => r.id) ?? [];
  return Array.from(new Set<number>([countryLocationId, ...childIds]));
}

type LocationResolution =
  | { kind: 'none' }
  | { kind: 'country'; locationIds: number[] }
  | { kind: 'city'; cityId: number; countryScopeIds: number[] | null };

async function resolveArticleLocationContext(slug: string): Promise<LocationResolution> {
  const bySlug = await hasuraQuery<{ restaurant_locations: RestaurantLocationRow[] }>(
    GET_RESTAURANT_LOCATION_BY_SLUG,
    { slug }
  );

  if (bySlug.errors?.length) {
    console.warn('[get-articles] resolve location by slug:', bySlug.errors[0]?.message);
    return { kind: 'none' };
  }

  const loc = bySlug.data?.restaurant_locations?.[0];
  if (!loc) return { kind: 'none' };

  if (String(loc.type).toLowerCase() === 'city') {
    const parentId = loc.parent_id;
    if (parentId != null && parentId > 0) {
      const countryScopeIds = await resolveCountryScopeIds(parentId);
      return { kind: 'city', cityId: loc.id, countryScopeIds };
    }
    return { kind: 'city', cityId: loc.id, countryScopeIds: null };
  }

  const locationIds = await resolveCountryScopeIds(loc.id);
  return { kind: 'country', locationIds };
}

async function fetchArticlesForLocations(
  locationIds: number[],
  limit: number,
  offset: number
): Promise<ArticleRow[]> {
  let result = await hasuraQuery<{ articles: ArticleRow[] }>(GET_ARTICLES_FOR_LOCATIONS, {
    limit,
    offset,
    locationIds,
  });

  if (result.errors?.length) {
    console.warn(
      '[get-articles] primary location query failed, using fallback:',
      result.errors[0]?.message
    );
    result = await hasuraQuery<{ articles: ArticleRow[] }>(GET_ARTICLES_FOR_LOCATIONS_FALLBACK, {
      limit,
      offset,
      locationIds,
    });
  }

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || 'Failed to fetch articles');
  }

  return result.data?.articles ?? [];
}

function mergeCityThenCountryArticles(
  cityArticles: ArticleRow[],
  countryArticles: ArticleRow[]
): ArticleRow[] {
  const seen = new Set<number>();
  const out: ArticleRow[] = [];
  for (const a of cityArticles) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  for (const a of countryArticles) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  return out;
}

function computeMergedHasMore(
  merged: ArticleRow[],
  offset: number,
  limit: number,
  cityHitCap: boolean,
  countryHitCap: boolean
): boolean {
  if (merged.length > offset + limit) return true;
  if (merged.length < offset + limit) return false;
  if (cityHitCap || countryHitCap) return true;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const locationSlug = searchParams.get('location_slug')?.trim() || '';

    let resolution: LocationResolution = { kind: 'none' };
    let locationResolved = false;
    if (locationSlug) {
      resolution = await resolveArticleLocationContext(locationSlug);
      locationResolved = resolution.kind === 'country' || resolution.kind === 'city';
    }

    const version = await getVersion('v:articles:all:v2');
    const cacheSegment =
      locationSlug && locationResolved
        ? `loc:${encodeURIComponent(locationSlug)}:v3-cityfill`
        : 'all';
    const cacheKey = `articles:${cacheSegment}:v${version}:limit=${limit}:offset=${offset}`;

    const { value: payload } = await cacheGetOrSetJSON<ArticlesPayload>(
      cacheKey,
      600,
      async (): Promise<ArticlesPayload> => {
        if (resolution.kind === 'country') {
          const articles = await fetchArticlesForLocations(resolution.locationIds, limit, offset);
          return { articles, hasMore: articles.length === limit };
        }

        if (resolution.kind === 'city' && resolution.countryScopeIds?.length) {
          const fetchCap = Math.min(MERGE_FETCH_CAP, offset + limit + 80);
          const [cityArticles, countryArticles] = await Promise.all([
            fetchArticlesForLocations([resolution.cityId], fetchCap, 0),
            fetchArticlesForLocations(resolution.countryScopeIds, fetchCap, 0),
          ]);
          const merged = mergeCityThenCountryArticles(cityArticles, countryArticles);
          const articles = merged.slice(offset, offset + limit);
          const hasMore = computeMergedHasMore(
            merged,
            offset,
            limit,
            cityArticles.length === fetchCap,
            countryArticles.length === fetchCap
          );
          return { articles, hasMore };
        }

        if (resolution.kind === 'city') {
          const articles = await fetchArticlesForLocations([resolution.cityId], limit, offset);
          return { articles, hasMore: articles.length === limit };
        }

        let result = await hasuraQuery<{ articles: ArticleRow[] }>(GET_ARTICLES, { limit, offset });

        if (result.errors?.length) {
          console.warn(
            '[get-articles] primary query failed, using fallback:',
            result.errors[0]?.message
          );
          result = await hasuraQuery<{ articles: ArticleRow[] }>(GET_ARTICLES_FALLBACK, {
            limit,
            offset,
          });
        }

        if (result.errors?.length) {
          throw new Error(result.errors[0]?.message || 'Failed to fetch articles');
        }

        const articles = result.data?.articles ?? [];
        return { articles, hasMore: articles.length === limit };
      }
    );

    return NextResponse.json({
      success: true,
      data: payload.articles,
      meta: {
        limit,
        offset,
        hasMore: payload.hasMore,
        ...(locationSlug
          ? { locationSlug, locationResolved }
          : {}),
      },
    });
  } catch (error) {
    console.error('[get-articles] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
