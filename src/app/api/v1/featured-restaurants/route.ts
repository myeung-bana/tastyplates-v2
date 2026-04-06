import { NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import {
  GET_FEATURED_RESTAURANTS,
  GET_FEATURED_RESTAURANTS_FALLBACK,
} from '@/app/graphql/FeaturedRestaurants/queries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

type FeaturedRow = Record<string, unknown>;

/**
 * Global featured list (no city_location_id on table).
 * `location_slug` is accepted for API compatibility with the client but ignored for filtering.
 */
export async function GET() {
  try {
    const version = await getVersion('v:featured-restaurants:v2');
    const cacheKey = `featured-restaurants:global:v${version}`;

    const { value: items } = await cacheGetOrSetJSON<FeaturedRow[]>(
      cacheKey,
      600,
      async () => {
        let result = await hasuraQuery<{ featured_restaurants: FeaturedRow[] }>(
          GET_FEATURED_RESTAURANTS,
          {}
        );

        if (result.errors?.length) {
          console.warn(
            '[featured-restaurants] primary query failed, trying fallback:',
            result.errors[0]?.message
          );
          result = await hasuraQuery<{ featured_restaurants: FeaturedRow[] }>(
            GET_FEATURED_RESTAURANTS_FALLBACK,
            {}
          );
        }

        if (result.errors?.length) {
          throw new Error(result.errors[0]?.message || 'Failed to fetch featured restaurants');
        }

        return result.data?.featured_restaurants ?? [];
      }
    );

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('[featured-restaurants] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured restaurants' },
      { status: 500 }
    );
  }
}
