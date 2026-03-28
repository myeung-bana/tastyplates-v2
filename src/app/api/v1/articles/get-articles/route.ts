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

type RestaurantLocationRow = { id: number; type: string; slug: string };

/**
 * Map a location slug to all `restaurant_locations.id` values that should match
 * `article_restaurant_location_associations.location_id`:
 * - city: that row only
 * - country: that row plus all active child locations (cities)
 */
async function resolveLocationIdsForSlug(slug: string): Promise<number[] | null> {
  const bySlug = await hasuraQuery<{ restaurant_locations: RestaurantLocationRow[] }>(
    GET_RESTAURANT_LOCATION_BY_SLUG,
    { slug }
  );

  if (bySlug.errors?.length) {
    console.warn('[get-articles] resolve location by slug:', bySlug.errors[0]?.message);
    return null;
  }

  const loc = bySlug.data?.restaurant_locations?.[0];
  if (!loc) return null;

  if (String(loc.type).toLowerCase() === 'city') {
    return [loc.id];
  }

  const children = await hasuraQuery<{ restaurant_locations: { id: number }[] }>(
    GET_CHILD_RESTAURANT_LOCATION_IDS,
    { parentId: loc.id }
  );

  if (children.errors?.length) {
    console.warn('[get-articles] child locations:', children.errors[0]?.message);
    return [loc.id];
  }

  const childIds = children.data?.restaurant_locations?.map((r) => r.id) ?? [];
  const ids = new Set<number>([loc.id, ...childIds]);
  return Array.from(ids);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const locationSlug = searchParams.get('location_slug')?.trim() || '';

    let locationIds: number[] | null = null;
    let locationResolved = false;
    if (locationSlug) {
      const resolved = await resolveLocationIdsForSlug(locationSlug);
      if (resolved?.length) {
        locationIds = resolved;
        locationResolved = true;
      }
      // If slug does not match any active `restaurant_locations` row, fall through to global list
      // so the homepage still shows articles; meta.locationResolved flags the fallback.
    }

    const version = await getVersion('v:articles:all:v2');
    const cacheSegment =
      locationSlug && locationResolved
        ? `loc:${encodeURIComponent(locationSlug)}`
        : 'all';
    const cacheKey = `articles:${cacheSegment}:v${version}:limit=${limit}:offset=${offset}`;

    const { value: articles } = await cacheGetOrSetJSON(
      cacheKey,
      600,
      async () => {
        if (locationIds?.length) {
          let result = await hasuraQuery(GET_ARTICLES_FOR_LOCATIONS, {
            limit,
            offset,
            locationIds,
          });

          if (result.errors?.length) {
            console.warn(
              '[get-articles] primary location query failed, using fallback:',
              result.errors[0]?.message
            );
            result = await hasuraQuery(GET_ARTICLES_FOR_LOCATIONS_FALLBACK, {
              limit,
              offset,
              locationIds,
            });
          }

          if (result.errors) {
            throw new Error(result.errors[0]?.message || 'Failed to fetch articles');
          }

          return result.data?.articles ?? [];
        }

        let result = await hasuraQuery(GET_ARTICLES, { limit, offset });

        if (result.errors?.length) {
          console.warn(
            '[get-articles] primary query failed, using fallback:',
            result.errors[0]?.message
          );
          result = await hasuraQuery(GET_ARTICLES_FALLBACK, { limit, offset });
        }

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to fetch articles');
        }

        return result.data?.articles ?? [];
      }
    );

    const hasMore = articles.length === limit;

    return NextResponse.json({
      success: true,
      data: articles,
      meta: {
        limit,
        offset,
        hasMore,
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
