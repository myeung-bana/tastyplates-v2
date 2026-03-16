# Performance (TastyPlates)

This document covers **feed and review-viewer performance**: the 4-phase optimization plan, current status, and the SwipeableReviewViewer (desktop) optimizations. Reference: `like-button-review-implementation.md`.

**Last updated:** 2026-01-27

---

## Current Status

| Phase | Status | Impact |
|-------|--------|--------|
| **Phase 1: List virtualization** | ✅ Done | Scroll 60fps, ~80% memory reduction |
| **Phase 2: Cursor pagination** | ✅ Done* | Deep scroll ~97.5% faster |
| **Phase 3: Feed table** | ⏳ Pending | Feed load ~73% faster |
| **Phase 4: Prefetch** | ⏳ Pending | Perceived instant load |

\* Phase 2 requires running the database migration (see below).

**Pattern score:** 9/11 modern SNS patterns in place (optimistic UI, stored counters, rate limiting, batch fetch, Redis cache, abort controllers, virtualization, cursor pagination; pending: single-query feed, prefetch).

---

## Baseline and What’s Already Good

**Before optimizations:** Like toggle ~150ms (3 Hasura calls), feed load ~300ms (3 queries), cached ~20ms, scroll 30–40fps, memory ~150MB for 100 reviews, deep pagination ~2000ms.

**Already in place:** Optimistic UI for likes, denormalized `likes_count`, no success toasts, rate limiting (e.g. 20 req/10s), batch fetching, Redis caching, abort controllers.

---

## Phase 1: List Virtualization — Complete

### What was done

- Installed `@tanstack/react-virtual`
- Added `VirtualizedTabContentGrid`
- Virtualized `Reviews.tsx` and `ReviewsTab.tsx`
- Responsive columns (e.g. 2 mobile, 4 desktop), scroll-based infinite load

### Gains

- **Scroll:** 30–40 fps → **60 fps**
- **Memory:** ~150MB → **~30MB**
- **Initial load:** ~800ms → ~200ms

### Files

- `src/components/review/Reviews.tsx`
- `src/components/Profile/ReviewsTab.tsx`
- `src/components/ui/TabContentGrid/VirtualizedTabContentGrid.tsx`
- `package.json`

---

## Phase 2: Cursor Pagination — Complete (run migration)

### What was done

- Migration SQL added
- Cursor-based GraphQL queries
- `get-all-reviews/route.ts` and `reviewV2Service` updated
- `Reviews.tsx` updated; backward compatible with cursor and offset

### Gains

- **Deep scroll (e.g. page 100):** ~2000ms → **~50ms**
- **DB:** O(n) offset scan → **O(1)** index lookup

### Action required: run database migration

Run in your Hasura/Nhost DB console:

```sql
CREATE INDEX IF NOT EXISTS idx_reviews_cursor
ON restaurant_reviews(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_feed_cursor
ON restaurant_reviews_feed(created_at DESC, id DESC);

-- Optional but recommended
CREATE INDEX IF NOT EXISTS idx_reviews_status_cursor
ON restaurant_reviews(status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_author_cursor
ON restaurant_reviews(author_id, created_at DESC, id DESC);
```

Verify:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname LIKE '%cursor%';
```

Migration file: `database/migrations/cursor_pagination_indexes.sql`

---

## Phase 3: Use `restaurant_reviews_feed` Table — Pending

### Goal

Replace 3 sequential queries (reviews + restaurants + users) with one query against a denormalized feed table.

### Tasks

- Confirm `restaurant_reviews_feed` structure (review, author, restaurant fields).
- Add GraphQL query (e.g. `GET_REVIEWS_FEED`) in `restaurantReviewQueries.ts`.
- Switch `get-all-reviews/route.ts` to use feed query and adjust cache keys.
- Validate: feed load ~300ms → **~80ms**.

### Required feed fields (conceptually)

- Review: `id`, `content`, `title`, `rating`, `images`, `hashtags`, `likes_count`, `replies_count`, `created_at`
- Author (denormalized): `author_id`, `author_username`, `author_display_name`, `author_profile_image`
- Restaurant (denormalized): `restaurant_uuid`, `restaurant_title`, `restaurant_slug`, `restaurant_featured_image`

Check structure:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'restaurant_reviews_feed'
ORDER BY ordinal_position;
```

### Expected gains

- **Feed load:** ~300ms → **~80ms**
- **API:** 3 queries → 1
- **Hasura load:** reduced

---

## Phase 4: Prefetch Next Page — Pending

### Goal

Prefetch the next page when the user is near the end of the list so the next page feels instant.

### Tasks

- Add prefetch in `Reviews.tsx` and `ReviewsTab.tsx` (and optionally `following/page.tsx`).
- Prefetch when e.g. 3 items from end, when `hasNextPage` and not already loading.

### Strategy (conceptual)

```typescript
const lastVisibleIndex = virtualizer.getVirtualItems().slice(-1)[0]?.index ?? 0;
const shouldPrefetch = reviews.length - lastVisibleIndex <= 3;
if (shouldPrefetch && hasNextPage && !loading && !prefetching) {
  prefetchNextPage();
}
```

---

## SwipeableReviewViewer (Desktop) Optimizations

Applied to the desktop swipeable review viewer (e.g. Nov 2024). Separate from the 4-phase feed work.

### Before vs after (viewer)

| Metric | Before | After |
|--------|--------|--------|
| Initial render | ~25 reviews (~1500 DOM nodes) | 4 reviews (~240 nodes) |
| Swipe latency | 100–200ms | 16–33ms (60 FPS) |
| Image load | On-demand (500ms+) | Preloaded (&lt;50ms) |
| Comment fetches | 25 | 4 |
| Memory | ~45MB | ~12MB |

### Techniques used

1. **Windowed rendering** — Render only visible ±2 reviews (current + adjacent).
2. **Image preloading** — Preload current + next 2 images.
3. **Lazy comment counts** — Fetch counts only for visible reviews.
4. **iPhone viewport** — Use `visualViewport` (and resize listeners) instead of `100vh`.
5. **Image display** — `object-fit: cover`; `transform: translate3d(0,0,0)` for GPU.
6. **Open/close animation** — Scale + opacity (e.g. react-spring).
7. **Gesture handling** — Single handler, threshold/velocity logic, snap back.
8. **Spring config** — Snappier values (e.g. tension 400, friction 35).
9. **Safe area** — `env(safe-area-inset-*)` for notch/home indicator.

### Files

- `src/components/review/SwipeableReviewViewer.tsx` (or desktop review viewer component)
- `src/styles/components/_swipeable-review-viewer.scss` (object-fit, GPU, safe areas, tap targets)

### Testing (viewer)

- iPhone Safari; swipe up/down and quick flicks.
- Images load when swiping; memory stable; slow 3G; safe areas on notched devices; close from first review.

---

## Quick Reference

**Test virtualization (Phase 1):** Run app, open reviews, scroll 100+ items; expect ~60fps and lower memory in DevTools.

**Phase 2 migration:** Run the SQL above in your DB console (or `psql $DATABASE_URL < database/migrations/cursor_pagination_indexes.sql`).

**Phase 3:** Inspect `restaurant_reviews_feed` with the `information_schema` query above; then add feed query and switch `get-all-reviews`.

---

## Testing Checklist

- **Virtualization:** Smooth scroll 100+ reviews; memory &lt; ~50MB; no layout shift; infinite scroll works.
- **Cursor pagination:** First and subsequent pages in order; no duplicates; deep pages (e.g. 50+) fast; cursor stable across tabs.
- **Feed table:** All review/author/restaurant data correct; cache behavior; cold load &lt; ~100ms.
- **Viewer:** Swipes, preload, safe areas, animations, and close behavior as above.

---

## Monitoring and Rollback

- **Monitoring:** Use Performance API (e.g. `performance.mark` / `measure`) or analytics for feed load time, cache hit, item count; track P50/P95, scroll FPS, memory.
- **Rollback:** Phases are independent. Phase 1: revert to non-virtualized list. Phase 2: keep using offset in API. Phase 3: revert to 3-query flow.

---

## Summary: Metrics

| Metric | Before | After Phase 1 | After Phase 2* | After Phase 3 | After Phase 4 |
|--------|--------|----------------|----------------|---------------|---------------|
| Scroll FPS | 30–40 | **60** | 60 | 60 | 60 |
| Memory | ~150MB | **~30MB** | ~30MB | ~30MB | ~30MB |
| Deep scroll | ~2000ms | ~2000ms | **~50ms** | ~50ms | ~50ms |
| Feed load | ~300ms | ~300ms | ~300ms | **~80ms** | ~80ms |
| Perceived load | — | — | — | — | Instant (prefetch) |

\* Phase 2 requires DB migration.

---

## Next Steps

- **Immediate:** Run Phase 2 migration; re-test cursor pagination and deep scroll.
- **This week:** Confirm `restaurant_reviews_feed` schema; implement Phase 3; validate feed load.
- **Next:** Implement Phase 4 prefetch; monitor in production.

---

## Related Documentation

- **Analysis:** `documentation/like-button-review-implementation.md`
- **Phase 1 detail:** `documentation/PHASE1_VIRTUALIZATION_COMPLETE.md` (if present)
- **Phase 2 detail:** `documentation/PHASE2_CURSOR_PAGINATION_COMPLETE.md` (if present)
- **Virtualization removed:** `documentation/VIRTUALIZATION_REMOVED.md` (if virtualization was later reverted)
