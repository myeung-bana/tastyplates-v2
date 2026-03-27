/**
 * rebuildRatingSummary.ts
 *
 * Recomputes overall + authentic rating aggregates for a single restaurant and
 * persists them to `restaurant_rating_summary`. Also syncs `restaurants.average_rating`
 * and `ratings_count` so the existing sort-by-rating mechanism reflects live data.
 *
 * Call this after any review create / update / delete.
 */

import { hasuraMutation, hasuraQuery } from '@/app/graphql/hasura-server-client';
import { hasMatchingPalates, normalizePalates } from '@/utils/palateUtils';

// Bayesian smoothing constants: pull ratings toward GLOBAL_MEAN until CONFIDENCE_M reviews exist.
const GLOBAL_MEAN = 4.0;
const CONFIDENCE_M = 5;

function bayesianWeighted(avg: number, count: number): number {
  return Number(
    (((avg * count) + (GLOBAL_MEAN * CONFIDENCE_M)) / (count + CONFIDENCE_M)).toFixed(4)
  );
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────

/** Fetch all non-deleted, non-reply reviews for a given restaurant. */
const GET_REVIEWS_FOR_REBUILD = `
  query RebuildGetReviews($restaurantUuid: uuid!) {
    restaurant_reviews(
      where: {
        restaurant_uuid: { _eq: $restaurantUuid }
        deleted_at: { _is_null: true }
        parent_review_id: { _is_null: true }
      }
    ) {
      rating
      status
      palates
    }
  }
`;

/** Fetch the integer ID + taxonomy of the restaurant (for matching + FK). */
const GET_RESTAURANT_FOR_REBUILD = `
  query RebuildGetRestaurant($uuid: uuid!) {
    restaurants(where: { uuid: { _eq: $uuid } }, limit: 1) {
      id
      palates
      cuisines
    }
  }
`;

/**
 * Upsert restaurant_rating_summary (PK = restaurant_id).
 * Hasura auto-generates insert_restaurant_rating_summary_one when the table is tracked.
 */
const UPSERT_RATING_SUMMARY = `
  mutation RebuildUpsertRatingSummary($object: restaurant_rating_summary_insert_input!) {
    insert_restaurant_rating_summary_one(
      object: $object
      on_conflict: {
        constraint: restaurant_rating_summary_pkey
        update_columns: [
          overall_review_count
          overall_rating_avg
          overall_rating_weighted
          authentic_review_count
          authentic_rating_avg
          authentic_rating_weighted
          review_version
          updated_at
        ]
      }
    ) {
      restaurant_id
    }
  }
`;

/**
 * Upsert restaurant_cuisine_rating_summary — one row per cuisine the restaurant belongs to.
 * Uses the same overall + authentic aggregates as the restaurant-level summary (Path A).
 * If the table is not yet tracked in Hasura the mutation will fail gracefully.
 */
const UPSERT_CUISINE_RATING_SUMMARY = `
  mutation RebuildUpsertCuisineRatingSummaries(
    $objects: [restaurant_cuisine_rating_summary_insert_input!]!
  ) {
    insert_restaurant_cuisine_rating_summary(
      objects: $objects
      on_conflict: {
        constraint: restaurant_cuisine_rating_summary_pkey
        update_columns: [
          search_review_count
          search_rating_avg
          search_rating_weighted
          authentic_review_count
          authentic_rating_avg
          authentic_rating_weighted
          review_version
          updated_at
        ]
      }
    ) {
      affected_rows
    }
  }
`;

/**
 * Keep restaurants.average_rating + ratings_count live so the existing
 * order_by: average_rating sort in get-restaurants reflects real data.
 * Uses uuid to avoid type uncertainty on the integer PK.
 */
const UPDATE_RESTAURANT_RATING = `
  mutation RebuildUpdateRestaurantRating(
    $uuid: uuid!
    $average_rating: numeric
    $ratings_count: Int!
  ) {
    update_restaurants(
      where: { uuid: { _eq: $uuid } }
      _set: { average_rating: $average_rating, ratings_count: $ratings_count }
    ) {
      affected_rows
    }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract cuisine integer IDs from a restaurant's `cuisines` JSONB field. */
function extractCuisineIds(cuisines: unknown): number[] {
  if (!cuisines) return [];
  const arr = Array.isArray(cuisines) ? cuisines : (() => {
    try { return JSON.parse(String(cuisines)); } catch { return []; }
  })();
  return (arr as unknown[])
    .map((c: unknown) => {
      if (typeof c === 'object' && c !== null && 'id' in c) return Number((c as { id: unknown }).id);
      return NaN;
    })
    .filter((id) => !isNaN(id) && id > 0);
}

/** Extract palate strings from a review's `palates` JSONB field. */
function extractReviewPalates(palates: unknown): string[] {
  if (!palates) return [];

  if (Array.isArray(palates)) {
    if (palates.every((p) => typeof p === 'string')) {
      return palates.map((p) => String(p).trim().toLowerCase()).filter(Boolean);
    }
    return palates
      .map((p: unknown) =>
        typeof p === 'string'
          ? p
          : (p as { slug?: string; name?: string })?.slug ||
            (p as { name?: string })?.name ||
            ''
      )
      .filter(Boolean)
      .map((p) => p.trim().toLowerCase());
  }

  if (typeof palates === 'string') {
    try {
      return extractReviewPalates(JSON.parse(palates));
    } catch {
      return palates
        .split('|')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  return [];
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Recompute rating aggregates for one restaurant and persist them.
 * Safe to call concurrently; upsert is idempotent.
 */
export async function rebuildRatingSummary(restaurantUuid: string): Promise<void> {
  // Fetch reviews and restaurant taxonomy in parallel
  const [reviewsResult, restaurantResult] = await Promise.all([
    hasuraQuery<{
      restaurant_reviews: Array<{ rating: number; status: string; palates: unknown }>;
    }>(GET_REVIEWS_FOR_REBUILD, { restaurantUuid }),
    hasuraQuery<{ restaurants: Array<{ id: number; palates: unknown; cuisines: unknown }> }>(
      GET_RESTAURANT_FOR_REBUILD,
      { uuid: restaurantUuid }
    ),
  ]);

  if (reviewsResult.errors) {
    console.error('[rebuildRatingSummary] Review query error:', reviewsResult.errors);
    return;
  }
  if (restaurantResult.errors) {
    console.error('[rebuildRatingSummary] Restaurant query error:', restaurantResult.errors);
    return;
  }

  const restaurant = restaurantResult.data?.restaurants?.[0];
  if (!restaurant) {
    console.warn('[rebuildRatingSummary] Restaurant not found:', restaurantUuid);
    return;
  }

  // Build a flat list of taxonomy strings (palates + cuisines) for palate-matching
  const restaurantTaxonomy = [
    ...normalizePalates(restaurant.palates as Parameters<typeof normalizePalates>[0]),
    ...normalizePalates(restaurant.cuisines as Parameters<typeof normalizePalates>[0]),
  ];

  // Accumulate overall + authentic aggregates (approved reviews only)
  const overall = { sum: 0, count: 0 };
  const authentic = { sum: 0, count: 0 };

  for (const review of reviewsResult.data?.restaurant_reviews ?? []) {
    if (review.status !== 'approved') continue;
    const rating = Number(review.rating) || 0;
    if (rating <= 0) continue;

    overall.sum += rating;
    overall.count += 1;

    // A review counts as "authentic" when the reviewer shares palate affinity with the restaurant
    const reviewerPalates = extractReviewPalates(review.palates);
    if (restaurantTaxonomy.length > 0 && hasMatchingPalates(restaurantTaxonomy, reviewerPalates)) {
      authentic.sum += rating;
      authentic.count += 1;
    }
  }

  const overallAvg = overall.count > 0 ? overall.sum / overall.count : null;
  const overallWeighted = overallAvg !== null ? bayesianWeighted(overallAvg, overall.count) : null;
  const authenticAvg = authentic.count > 0 ? authentic.sum / authentic.count : null;
  const authenticWeighted =
    authenticAvg !== null ? bayesianWeighted(authenticAvg, authentic.count) : null;

  // Upsert restaurant_rating_summary
  const summaryResult = await hasuraMutation(UPSERT_RATING_SUMMARY, {
    object: {
      restaurant_id: restaurant.id,
      overall_review_count: overall.count,
      overall_rating_avg:
        overallAvg !== null ? Number(overallAvg.toFixed(4)) : null,
      overall_rating_weighted: overallWeighted,
      authentic_review_count: authentic.count,
      authentic_rating_avg:
        authenticAvg !== null ? Number(authenticAvg.toFixed(4)) : null,
      authentic_rating_weighted: authenticWeighted,
      review_version: Math.floor(Date.now() / 1000),
      updated_at: new Date().toISOString(),
    },
  });

  if (summaryResult.errors) {
    console.error('[rebuildRatingSummary] Upsert summary error:', summaryResult.errors);
  }

  // Sync restaurants.average_rating (raw avg for display) + ratings_count
  const ratingResult = await hasuraMutation(UPDATE_RESTAURANT_RATING, {
    uuid: restaurantUuid,
    average_rating: overallAvg !== null ? Number(overallAvg.toFixed(4)) : null,
    ratings_count: overall.count,
  });

  if (ratingResult.errors) {
    console.error('[rebuildRatingSummary] Update restaurant rating error:', ratingResult.errors);
  }

  // Populate restaurant_cuisine_rating_summary (Path A):
  // One row per cuisine the restaurant belongs to, using the same overall + authentic aggregates.
  // This powers cuisine-page sorting without needing a cuisine_id on individual reviews.
  const cuisineIds = extractCuisineIds(restaurant.cuisines);
  if (cuisineIds.length > 0) {
    const versionTs = Math.floor(Date.now() / 1000);
    const cuisineObjects = cuisineIds.map((cuisineId) => ({
      restaurant_id: restaurant.id,
      cuisine_id: cuisineId,
      // "Search" score in cuisine context = overall rating of the restaurant
      search_review_count: overall.count,
      search_rating_avg: overallAvg !== null ? Number(overallAvg.toFixed(4)) : null,
      search_rating_weighted: overallWeighted,
      // Authentic score stays the same as the restaurant-level authentic aggregate
      authentic_review_count: authentic.count,
      authentic_rating_avg: authenticAvg !== null ? Number(authenticAvg.toFixed(4)) : null,
      authentic_rating_weighted: authenticWeighted,
      review_version: versionTs,
      updated_at: new Date().toISOString(),
    }));

    const cuisineResult = await hasuraMutation(UPSERT_CUISINE_RATING_SUMMARY, {
      objects: cuisineObjects,
    });

    if (cuisineResult.errors) {
      // Non-fatal: table may not be tracked in Hasura yet
      console.warn('[rebuildRatingSummary] Cuisine summary upsert error:', cuisineResult.errors);
    }
  }
}
