# Performance Optimization Implementation Plan

**Status:** In Progress  
**Created:** 2026-01-27  
**Reference:** Based on `like-button-review-implementation.md` analysis

---

## Executive Summary

This document outlines the implementation plan to optimize TastyPlates performance to match modern SNS platforms (Instagram, Twitter, TikTok). Based on code analysis, we've identified key bottlenecks and prioritized fixes by ROI.

---

## Current Performance Baseline

### Metrics (Before Optimization)
- **Like Toggle Response:** ~150ms (3 Hasura calls)
- **Feed Load (Cold):** ~300ms (3 sequential queries)
- **Feed Load (Cached):** ~20ms (Redis hit)
- **Scroll FPS:** 30-40 fps (all items in DOM)
- **Memory (100 reviews):** ~150MB (no virtualization)
- **Deep Pagination (offset 1000):** ~2000ms (offset scan)

### What's Already Good ✅
1. ✅ Optimistic UI updates (`useReviewLike.ts`)
2. ✅ Stored counters (denormalized `likes_count`)
3. ✅ No success toasts (smooth UX)
4. ✅ Rate limiting (20 req/10s)
5. ✅ Batch fetching (restaurants + authors)
6. ✅ Redis caching (5min TTL)
7. ✅ Abort controllers (prevent race conditions)

---

## Implementation Phases

### Phase 1: List Virtualization ⚡ **HIGH IMPACT**
**Status:** 🟡 In Progress  
**Estimated Time:** 2-4 hours  
**Expected Improvement:** 30-40 fps → **60 fps**, 150MB → **30MB**

#### Why This First?
- Biggest perceived performance gain
- No backend changes needed
- Fixes laggy scrolling immediately
- Reduces memory consumption by 80%

#### Files to Modify
- [ ] `src/components/review/Reviews.tsx` - Add virtualization to trending/for-you tabs
- [ ] `src/components/Profile/ReviewsTab.tsx` - Virtualize user reviews
- [ ] `src/app/following/page.tsx` - Virtualize following feed
- [ ] `src/components/Restaurant/Listing/Listing.tsx` - Virtualize listings

#### Implementation
```typescript
// Use @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: reviews.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 400, // Average review card height
  overscan: 5 // Render 5 extra items above/below
});
```

---

### Phase 2: Cursor-Based Pagination 🎯 **MEDIUM-HIGH IMPACT**
**Status:** ⚪ Pending  
**Estimated Time:** 1 day  
**Expected Improvement:** Deep scroll 2000ms → **50ms**

#### Why This Matters?
- Offset pagination gets exponentially slower
- At offset=1000, database scans 1000 rows just to skip them
- Cursor pagination is O(1) regardless of depth

#### Database Changes Required
```sql
-- Add composite index for cursor pagination
CREATE INDEX idx_reviews_cursor ON restaurant_reviews(created_at DESC, id DESC);
CREATE INDEX idx_reviews_feed_cursor ON restaurant_reviews_feed(created_at DESC, id DESC);
```

#### Files to Modify
- [ ] `src/app/api/v1/restaurant-reviews/get-all-reviews/route.ts` - Accept cursor param
- [ ] `src/app/api/v1/restaurant-reviews/get-following-feed/route.ts` - Accept cursor param
- [ ] `src/app/api/v1/restaurant-reviews/get-user-reviews/route.ts` - Accept cursor param
- [ ] `src/app/api/v1/services/reviewV2Service.ts` - Update service interface
- [ ] `src/components/review/Reviews.tsx` - Use cursor instead of offset
- [ ] `src/hooks/useFollowingReviewsGraphQL.ts` - Use cursor
- [ ] `src/components/Profile/ReviewsTab.tsx` - Use cursor

#### API Changes
```typescript
// Before (offset-based)
GET /api/v1/restaurant-reviews/get-all-reviews?limit=16&offset=48

// After (cursor-based)
GET /api/v1/restaurant-reviews/get-all-reviews?limit=16&cursor=2024-01-15T10:30:00Z_uuid123
```

---

### Phase 3: Use restaurant_reviews_feed Table 🚀 **HIGH IMPACT**
**Status:** ⚪ Pending  
**Estimated Time:** 4-6 hours  
**Expected Improvement:** 300ms → **80ms** (3 queries → 1 query)

#### Current Problem
```typescript
// 3 sequential Hasura calls = ~150ms total
1. GET_ALL_REVIEWS          // ~50ms
2. GET_RESTAURANTS_BY_UUIDS // ~50ms  
3. GET_RESTAURANT_USERS_BY_IDS // ~50ms
```

#### Solution: Use Denormalized Feed Table
Since you have `restaurant_reviews_feed` table (materialized view with pre-joined data), we can fetch everything in ONE query.

#### GraphQL Query to Create
```graphql
query GetReviewsFeed($limit: Int!, $cursor: timestamptz) {
  restaurant_reviews_feed(
    where: { created_at: { _lt: $cursor } }
    order_by: [{ created_at: desc }, { id: desc }]
    limit: $limit
  ) {
    # Review fields
    id
    content
    title
    rating
    images
    hashtags
    likes_count
    replies_count
    created_at
    
    # Author fields (denormalized)
    author_id
    author_username
    author_display_name
    author_profile_image
    
    # Restaurant fields (denormalized)
    restaurant_uuid
    restaurant_title
    restaurant_slug
    restaurant_featured_image
  }
}
```

#### Files to Modify
- [ ] `src/app/graphql/RestaurantReviews/restaurantReviewQueries.ts` - Add GET_REVIEWS_FEED query
- [ ] `src/app/api/v1/restaurant-reviews/get-all-reviews/route.ts` - Use feed table
- [ ] Update cache keys to reflect new data source

---

### Phase 4: Prefetch Next Page 🎁 **LOW-MEDIUM IMPACT**
**Status:** ⚪ Pending  
**Estimated Time:** 2-3 hours  
**Expected Improvement:** Perceived load time reduction

#### Implementation Strategy
```typescript
// When user is 3 items from the end, prefetch next page
useEffect(() => {
  const lastVisibleIndex = virtualizer.getVirtualItems().slice(-1)[0]?.index || 0;
  const shouldPrefetch = reviews.length - lastVisibleIndex <= 3;
  
  if (shouldPrefetch && hasNextPage && !loading) {
    prefetchNextPage(); // Silent background fetch
  }
}, [virtualizer.scrollOffset]);
```

#### Files to Modify
- [ ] `src/components/review/Reviews.tsx` - Add prefetch logic
- [ ] `src/components/Profile/ReviewsTab.tsx` - Add prefetch
- [ ] `src/app/following/page.tsx` - Add prefetch

---

## Expected Results (After All Phases)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Like Response | 150ms | 150ms* | No change (DB function needed) |
| Feed Load (Cold) | 300ms | **80ms** | **73% faster** |
| Feed Load (Cached) | 20ms | **15ms** | 25% faster |
| Scroll FPS | 30-40 | **60** | **50% smoother** |
| Memory (100 reviews) | 150MB | **30MB** | **80% reduction** |
| Deep Pagination (offset 1000) | 2000ms | **50ms** | **97.5% faster** |

\* Like response would be 30ms with database function (3 calls → 1 call), but that requires database access we don't have.

---

## Phase-by-Phase Rollout Plan

### Week 1
- ✅ Install @tanstack/react-virtual
- ⏳ **Phase 1:** Implement list virtualization
  - Day 1-2: Reviews.tsx, ReviewsTab.tsx
  - Day 3: Following page, Listing page
  - Day 4: Testing & refinement

### Week 2
- **Phase 2:** Cursor pagination
  - Day 1: Database indexes + API endpoint updates
  - Day 2-3: Frontend migration
  - Day 4: Testing & validation

### Week 3
- **Phase 3:** Use restaurant_reviews_feed table
  - Day 1: Create GraphQL queries
  - Day 2-3: Update API routes
  - Day 4: Cache invalidation strategy

### Week 4
- **Phase 4:** Prefetch optimization
  - Day 1-2: Implementation
  - Day 3-4: Performance testing

---

## Testing Checklist

### Virtualization Testing
- [ ] Scroll smoothly through 100+ reviews
- [ ] Memory usage stays under 50MB
- [ ] No layout shifts or jumps
- [ ] Images lazy load correctly
- [ ] Infinite scroll still works

### Cursor Pagination Testing
- [ ] First page loads correctly
- [ ] Subsequent pages load in order
- [ ] No duplicate items
- [ ] Deep pagination (page 50+) is fast
- [ ] Cursor persists across tab switches

### Feed Table Testing
- [ ] All review data displays correctly
- [ ] Author info populated
- [ ] Restaurant info populated
- [ ] Cache hits/misses logged
- [ ] Performance improvement verified

---

## Monitoring & Metrics

### Add Performance Monitoring
```typescript
// Track real-world performance
performance.mark('feed-start');
const response = await fetchReviews();
performance.mark('feed-end');

const measure = performance.measure('feed-load', 'feed-start', 'feed-end');
console.log('Feed load time:', measure.duration);

// Send to analytics
analytics.track('feed_performance', {
  duration: measure.duration,
  cache_hit: response.cacheHit,
  items_count: response.reviews.length
});
```

### Key Metrics to Track
- P50, P95, P99 load times
- Cache hit rates
- Memory usage profiles
- Frame rate during scroll
- Time to interactive

---

## Rollback Plan

Each phase is independent and can be rolled back:

### Phase 1 Rollback
```typescript
// Revert to standard map
{reviews.map((review, index) => (
  <ReviewCard2 key={review.id} data={review} />
))}
```

### Phase 2 Rollback
```typescript
// Keep offset pagination
const offset = parseInt(searchParams.get('offset') || '0');
```

### Phase 3 Rollback
```typescript
// Use original 3-query approach
const result = await hasuraQuery(GET_ALL_REVIEWS, {...});
// ... fetch restaurants
// ... fetch authors
```

---

## Additional Optimizations (Future)

### Database Function for Toggle Like (Requires DB Access)
Would reduce like latency from 150ms → 30ms, but requires:
```sql
CREATE OR REPLACE FUNCTION toggle_review_like(
  p_review_id uuid,
  p_user_id uuid
) RETURNS json AS $$
-- Single transaction: check + toggle + count
END;
$$ LANGUAGE plpgsql;
```

### Real-time Subscriptions
For "other users seeing updates":
- Use Hasura subscriptions for live likes/comments
- Keep payloads small (just IDs + counts)
- Only subscribe to visible items

### Edge Caching
- Deploy review feed to Vercel Edge Functions
- Cache at CDN level (Cloudflare/Vercel Edge)
- Reduce latency to <50ms globally

---

## Success Criteria

✅ **Phase 1 Success:**
- Scroll at 60fps with 500+ reviews loaded
- Memory usage < 50MB
- No visual glitches

✅ **Phase 2 Success:**
- Deep pagination (page 100) loads in <100ms
- No duplicate items
- Cursor works across all feed types

✅ **Phase 3 Success:**
- Feed load time < 100ms (cold)
- Cache hit rate > 80%
- Single Hasura query instead of 3

✅ **Phase 4 Success:**
- Next page ready before user reaches end
- No loading states visible
- Seamless infinite scroll

---

## References

- Original Analysis: `documentation/like-button-review-implementation.md`
- @tanstack/react-virtual: https://tanstack.com/virtual/latest
- Hasura Cursors: https://hasura.io/docs/latest/queries/postgres/pagination/
- Performance Best Practices: https://web.dev/vitals/

---

**Last Updated:** 2026-01-27  
**Next Review:** After Phase 1 completion
