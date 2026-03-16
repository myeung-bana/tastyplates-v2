# Redis Guide (Upstash) for TastyPlates v2

This guide covers **Upstash Redis** in the TastyPlates v2 Next.js app for:

- **Shared caching** — reduce Hasura load, speed up repeated reads
- **Rate limiting** — prevent abuse on likes, comments, uploads, and user actions
- **Cache invalidation** — versioned keys so writes keep caches fresh

The app uses Hasura via server-side GraphQL and has read-heavy API routes under `src/app/api/v1/*`. Redis gives **shared cache across users and server instances**, which matters in serverless. Redis is **not required** to run the app; endpoints fall back to direct queries if Redis is unavailable.

---

## Why Upstash

- **Serverless-friendly**: REST API client, no long-lived TCP connections.
- **Free tier**: 10,000 commands/day, 256 MB — good for initial rollout.
- **Fast wins**: protects expensive endpoints (uploads) and cuts repeated Hasura calls.

---

## Setup

### Dependencies

```bash
yarn add @upstash/redis @upstash/ratelimit
```

Current versions in use: `@upstash/redis@1.36.0`, `@upstash/ratelimit@2.0.7`.

### Environment variables

Add to `.env.local` (and your hosting provider):

```bash
UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_REDIS_REST_URL"
UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REDIS_REST_TOKEN"
```

Get these from [Upstash Console](https://console.upstash.com/). Do not commit real tokens; use `.env.example` as placeholders only.

### Server-only client

Use Redis only from **server code** (`src/app/api/**/route.ts` and server utilities). Do not import into client components.

**`src/lib/upstash-redis.ts`** — Base client using `Redis.fromEnv()` (reads the env vars above).

---

## Helpers (implementation)

### `src/lib/redis-cache.ts`

- **`cacheGetOrSetJSON<T>(key, ttlSeconds, fn)`** — Returns cached JSON or runs `fn`, stores result, returns `{ value, hit }`.
- **`cacheInvalidate(key)`** — Deletes a cache key.
- Errors fall back to direct queries; failures are logged and do not break the API.

### `src/lib/redis-versioning.ts`

- **`getVersion(key)`** — Current version number for a resource.
- **`bumpVersion(key)`** — Increments version (Redis INCR) to invalidate all caches that include this version in their key.

Cache keys include the version, e.g. `reviews:restaurant:{uuid}:v{version}:limit=10:offset=0`, so bumping the version key invalidates related caches without pattern deletes.

### `src/lib/redis-ratelimit.ts`

Five limiters (sliding window), with graceful fallback if Redis fails (requests allowed through):

| Limiter | Limit | Purpose |
|--------|--------|--------|
| **uploadRateLimit** | 10 / 60 s | Uploads, batch uploads, Google photo proxy (per IP) |
| **likeRateLimit** | 20 / 10 s | Like/unlike |
| **createRateLimit** | 5 / 30 s | Create review, create comment |
| **followRateLimit** | 10 / 10 s | Follow, unfollow |
| **wishlistRateLimit** | 15 / 10 s | Toggle check-in, toggle favorite |

---

## Caching

### Cached endpoints

| Endpoint | TTL | Cache key pattern | Version key |
|---------|-----|-------------------|-------------|
| `/api/v1/restaurant-users/suggested` | 60 s | `users:suggested:v{version}:limit={limit}:exclude={userId}` | `v:users:suggested` |
| `/api/v1/restaurant-reviews/get-replies` | 10 s | `replies:{parentReviewId}:user={userId}:v{version}` | `v:review:{parentReviewId}:replies` |
| `/api/v1/restaurant-reviews/get-reviews-by-restaurant` | 30 s | `reviews:restaurant:{uuid}:v{version}:limit={limit}:offset={offset}` | `v:restaurant:{uuid}:reviews` |
| `/api/v1/restaurant-reviews/get-all-reviews` | 15 s | `reviews:all:v{version}:limit={limit}:offset={offset}` | `v:reviews:all` |
| `/api/v1/restaurants-v2/get-restaurants` | 30 s | `restaurants:v{version}:{JSON params}` | `v:restaurants:all` |

### Debugging

Cached responses send:

- **`X-Cache: HIT`** or **`X-Cache: MISS`**
- **`X-Cache-Key`** (on some endpoints)

Use these in browser dev tools or `curl -I` to confirm cache behavior.

### Cache invalidation (on writes)

When write operations succeed, the app bumps version keys so the next read fetches fresh data.

**Create review:**

```typescript
await Promise.all([
  bumpVersion(`v:restaurant:${restaurant_uuid}:reviews`),
  bumpVersion(`v:reviews:all`),
  bumpVersion(`v:user:${author_id}:reviews`),
]);
```

**Create comment/reply:**

```typescript
await bumpVersion(`v:review:${parent_review_id}:replies`);
```

**Restaurant updated:** `bumpVersion('v:restaurants:all')`  
**Suggested users refresh:** `bumpVersion('v:users:suggested')`

### TTL tuning

- **Hot (feeds):** 10–15 s  
- **Warm (restaurant lists):** 30–60 s  
- **Cold (profiles):** 5–10 min  

Adjust the `ttlSeconds` parameter in the relevant `route.ts` files.

---

## Rate limiting

### Protected endpoints

| Endpoint | Limiter | Identifier |
|----------|---------|------------|
| `/api/v1/upload/image` | uploadRateLimit | IP |
| `/api/v1/upload/batch` | uploadRateLimit | IP |
| `/api/v1/images/download-google-photo` | uploadRateLimit | IP |
| `/api/v1/restaurant-reviews/create-review` | createRateLimit | user |
| `/api/v1/restaurant-reviews/create-comment` | createRateLimit | user |
| `/api/v1/restaurant-reviews/toggle-like` | likeRateLimit | user |
| `/api/v1/restaurant-users/follow` | followRateLimit | user |
| `/api/v1/restaurant-users/unfollow` | followRateLimit | user |
| `/api/v1/restaurant-users/toggle-checkin` | wishlistRateLimit | user |
| `/api/v1/restaurant-users/toggle-favorite` | wishlistRateLimit | user |

### 429 response

When the limit is exceeded:

- **Status:** `429 Too Many Requests`
- **Header:** `Retry-After: <seconds>`
- **Body:**

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": <seconds>
}
```

### Changing limits

Edit `src/lib/redis-ratelimit.ts`. Example — allow 20 uploads per minute:

```typescript
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "ratelimit:upload",
});
```

---

## Performance

**Before caching (typical):** Restaurant list ~200–500 ms, review feeds ~150–300 ms, replies ~100–200 ms, suggested users ~80–150 ms.

**After caching (cache hit):** ~5–20 ms for these endpoints; ~90–95% faster and ~60–80% less Hasura query volume.

**Error handling:** If Redis is down or rate limiting fails, endpoints still work (direct Hasura or allow-through). Errors are logged; cache/rate-limit failures are transparent to users.

---

## Testing

### Cache

```bash
# First request (MISS), second (HIT)
curl -I "http://localhost:3000/api/v1/restaurant-users/suggested?limit=6"
curl -I "http://localhost:3000/api/v1/restaurant-users/suggested?limit=6"
```

Check for `X-Cache: HIT` on the second. Server logs: `✅ Cache HIT: {key}` / `❌ Cache MISS: {key}`.

### Rate limits

```bash
# Upload: should get 429 after 10 requests in 60 s
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/v1/upload/image -F "file=@test.jpg" -w "\nStatus: %{http_code}\n"
  sleep 1
done

# Like: should get 429 after 20 requests in 10 s
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/v1/restaurant-reviews/toggle-like \
    -H "Content-Type: application/json" \
    -d '{"review_id":"<uuid>","user_id":"<uuid>"}' -w "\nStatus: %{http_code}\n"
done
```

---

## Monitoring

- **Upstash Console** — Command usage, cache/rate-limit analytics.
- **Server logs** — Cache HIT/MISS, `⚠️ Rate limit error for key {key}`, Redis fallback messages.
- **Response headers** — `X-Cache`, `Retry-After` when rate limited.
- **App analytics** — Count 429s and monitor `Retry-After` for abuse or tuning.

---

## Next steps (optional)

1. **Idempotency** — `Idempotency-Key` header on create-review / create-comment / upload; store result in Redis for 5–10 min to avoid duplicate submissions.
2. **More invalidation** — Bump versions when deleting or updating reviews/comments.
3. **Object caching** — Cache restaurant-by-UUID and user-by-ID with longer TTL (e.g. 5 min) to reduce repeated lookups.
4. **UX** — Show “X requests remaining” or retry countdown when rate limited.

---

## Summary

- **Caching:** 5 read endpoints use versioned cache keys and short TTLs; writes bump versions so caches stay fresh.
- **Rate limiting:** 10 endpoints use 5 limiters (upload, like, create, follow, wishlist) with per-user or per-IP keys.
- **Resilience:** Redis failures do not break the API; endpoints fall back to direct Hasura or allow requests through.
- **Production:** Add Upstash credentials to `.env.local`, restart the server, and use the headers/logs above to verify behavior.
