# Redis Guide (Upstash) for TastyPlates v2

This guide explains **how to add Upstash Redis** to this Next.js monolith (TastyPlates v2) for:

- **Rate limiting** (prevent abuse for likes/comments/uploads)
- **Shared caching** (reduce Hasura/external API load, speed up repeated reads)
- **Idempotency** (prevent duplicate submissions)
- Optional: **feed/ranking** (trending reviews) and background jobs later

This repo currently uses **Hasura via server-side GraphQL helpers** and has multiple read-heavy API routes under `src/app/api/v1/*`. It also has ad-hoc client/in-memory caches; Redis makes caching **shared across users and server instances** (critical in serverless deployments).

---

## Why Upstash (and why now)

Upstash is a good fit because:

- **Serverless-friendly**: REST API client avoids long-lived TCP connections.
- **Free plan**: great for initial caching + rate limiting rollout.
- **Fast wins**: protects expensive endpoints (uploads) and reduces repeated Hasura calls.

Redis is **not required** to run the app, but it can **improve performance and reliability** once traffic grows and API endpoints are called frequently.

---

## What parts of this codebase benefit most

### High ROI (do first)

1. **Rate limit** write/cost endpoints:
   - `/api/v1/upload/image`, `/api/v1/upload/batch`
   - `/api/v1/images/download-google-photo`
   - `/api/v1/restaurant-reviews/create-review`
   - `/api/v1/restaurant-reviews/create-comment`
   - `/api/v1/restaurant-reviews/toggle-like`
   - `/api/v1/restaurant-users/*` (follow/unfollow/toggle-checkin/toggle-favorite)

2. **Cache read-heavy endpoints** (short TTL):
   - `/api/v1/restaurants-v2/get-restaurants`
   - `/api/v1/restaurant-reviews/get-all-reviews`
   - `/api/v1/restaurant-reviews/get-reviews-by-restaurant`
   - `/api/v1/restaurant-reviews/get-replies`
   - `/api/v1/restaurant-users/suggested`

3. **Object caching** to reduce repeated Hasura lookups (medium TTL):
   - restaurant by uuid
   - user by id

### Medium ROI (next)

4. **Idempotency** for write endpoints (prevents double submissions)
5. **Cached counters** (draft/published counts, followers counts) for dashboards/profile pages

### Optional / Advanced

6. **Trending ranking** using Redis sorted sets
7. **Job queue** (BullMQ) if you introduce background workers (not recommended on Free plan)

---

## Step 1 — Add Upstash dependencies

Add these packages:

```bash
yarn add @upstash/redis @upstash/ratelimit
```

---

## Step 2 — Add environment variables

Add to `.env.local` (and hosting provider settings):

```bash
UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_REDIS_REST_URL"
UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REDIS_REST_TOKEN"
```

Notes:
- **Never commit real tokens.**
- Prefer adding these to `.env.example` as placeholders only.

---

## Step 3 — Create a server-only Redis client

Create a module like `src/lib/upstash-redis.ts`:

```ts
import { Redis } from "@upstash/redis"

export const redis = Redis.fromEnv()
```

**Important**: Only import/use this from **server code**:
- `src/app/api/**/route.ts`
- server utilities used by route handlers

Do **not** import it into client components.

---

## Step 4 — Add shared helpers (recommended)

### 4.1 Caching helper (get-or-set JSON)

Create `src/lib/redis-cache.ts`:

```ts
import { redis } from "./upstash-redis"

export async function cacheGetOrSetJSON<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<{ value: T; hit: boolean }> {
  const cached = await redis.get<T>(key)
  if (cached !== null && cached !== undefined) {
    return { value: cached, hit: true }
  }

  const value = await fn()
  await redis.set(key, value, { ex: ttlSeconds })
  return { value, hit: false }
}
```

### 4.2 Versioned keys for invalidation (no KEYS needed)

Upstash REST supports scans, but pattern deletes are still something you want to avoid. A safe pattern is **versioned keys**:

Create `src/lib/redis-versioning.ts`:

```ts
import { redis } from "./upstash-redis"

export async function getVersion(key: string): Promise<number> {
  const v = await redis.get<number>(key)
  return typeof v === "number" ? v : 0
}

export async function bumpVersion(key: string): Promise<number> {
  // INCR creates the key if missing
  return await redis.incr(key)
}
```

Example:
- `v:restaurant:{uuid}:reviews`
- `v:user:{uuid}:reviews`
- `v:review:{reviewId}:replies`

Cache keys include these versions so writes “invalidate” by incrementing:

```
reviews:restaurant:{uuid}:v{vRestaurantReviews}:limit=10:offset=0
replies:review:{parentReviewId}:v{vReplies}
```

---

## Step 5 — Add rate limiting (Upstash Ratelimit)

Create `src/lib/redis-ratelimit.ts`:

```ts
import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./upstash-redis"

// Sliding window is usually best UX for user actions
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
})

export async function rateLimitOrThrow(key: string) {
  const result = await ratelimit.limit(key)
  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    const error = new Error("Rate limit exceeded")
    ;(error as any).status = 429
    ;(error as any).retryAfter = retryAfter
    return { ok: false as const, retryAfter }
  }
  return { ok: true as const }
}
```

### Where to apply it

**Uploads** (protect cost):
- 10 requests / 60s per user + per IP

**Likes**:
- 20 / 10s per user (or 60/min)

**Comments**:
- 5 / 10s per user

**Create review**:
- 2 / 30s per user (tune as needed)

**Google photo proxy**:
- strict per IP (to avoid bandwidth abuse)

---

## Step 6 — Apply Redis to real endpoints in this repo

### 6.1 Toggle like (`/api/v1/restaurant-reviews/toggle-like`)

What Redis should do here:
- **Rate limit** the endpoint.
- **Optionally** cache GET “like status” for a user+review for a very short TTL (5–15s).
- **Invalidate** cached “review details” and “review replies” versions if your UI depends on it.

Pseudo-flow:

```ts
// rateLimit key: like:{userId}
await rateLimitOrThrow(`like:${user_id}`)

// do Hasura mutation

// invalidate version keys (examples)
await bumpVersion(`v:review:${review_id}:meta`)
// if replies UI shows likes_count quickly:
// await bumpVersion(`v:review:${parent_review_id}:replies`)
```

### 6.2 Create comment (`/api/v1/restaurant-reviews/create-comment`)

What Redis should do:
- Rate limit: `comment:{author_id}`
- Idempotency (optional): `idem:comment:{author_id}:{idempotencyKey}`
- Invalidate replies list: bump `v:review:{parent_review_id}:replies`

### 6.3 Create review (`/api/v1/restaurant-reviews/create-review`)

What Redis should do:
- Rate limit: `review:create:{author_id}`
- Idempotency: `idem:review:create:{author_id}:{idempotencyKey}`
- Invalidate:
  - `v:restaurant:{restaurant_uuid}:reviews`
  - `v:user:{author_id}:reviews`
  - possibly global feeds: `v:feed:all`

### 6.4 Read endpoints (cache)

For:
- `get-all-reviews`
- `get-reviews-by-restaurant`
- `get-replies`
- `restaurants-v2/get-restaurants`
- `restaurant-users/suggested`

Cache strategy:
- Cache the **final JSON** returned by the route handler with **short TTL**.
- Additionally cache “objects” (restaurant/user) with medium TTL to reduce repeated Hasura lookups.

Example of versioned cache key for restaurant reviews:

```
vKey = v:restaurant:{restaurant_uuid}:reviews
cacheKey = reviews:restaurant:{restaurant_uuid}:v{v}:limit={limit}:offset={offset}
ttl = 30s
```

---

## Step 7 — Idempotency (phasing out duplicates)

### How it works

Client sends:
- `Idempotency-Key: <uuid>` header for create-review/create-comment/upload.

Server:
- Checks Redis for `idem:{route}:{userId}:{key}`
- If present, return stored response
- If missing, run request, then store response for ~5–10 minutes

This is especially valuable on:
- review creation
- comment creation
- uploads (avoids duplicate S3 writes)

---

## Operational notes (Upstash Free plan)

To keep within limits:
- Prefer **short TTL** for full route-response caching.
- Prefer **object caching** for restaurants/users (small payloads).
- Avoid caching very large arrays for long durations.
- Avoid scanning/deleting by pattern; use **versioned keys**.

---

## Will it improve performance?

Typically yes, especially for:
- review feeds and restaurant pages (less Hasura N+1 calls)
- high-frequency actions (likes/comments) by adding rate limiting + reducing retries/dup submits
- serverless deployments where in-memory caches don’t persist

However:
- Redis adds complexity; always start with **Phase 1 (rate limit) + Phase 2 (small cache)** first.

---

## Suggested rollout plan (practical)

1. **Add Upstash client + helpers**
2. **Rate limit** uploads + likes + comments + create-review
3. **Cache** `restaurants-v2/get-restaurants` and `restaurant-users/suggested`
4. **Cache** `get-replies` (short TTL) + add version bump on create-comment
5. **Add versioned caching** to restaurant review lists and invalidate on create/update/delete review
6. Add idempotency (create-review + create-comment)

---

## Next steps

If you want, I can:
- add the Upstash helpers (`src/lib/upstash-redis.ts`, `src/lib/redis-cache.ts`, `src/lib/redis-ratelimit.ts`, `src/lib/redis-versioning.ts`)
- wire rate limiting + caching into the specific API routes listed above
- provide a small “key registry” table (keys + TTLs + invalidation triggers) for maintainability


