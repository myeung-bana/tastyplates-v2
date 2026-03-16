Below is a “how modern companies do it” breakdown, mapped to your stack: **Next.js (web) + monolith API + Nhost/Hasura (Postgres + GraphQL)**.

---

## Current implementation snapshot (as of codebase review)

This section reflects what the code actually does today: like toggle, comments/replies, and review feed.

### Data model (Hasura / Postgres)

- **Reviews and comments** — Same table `restaurant_reviews`. Top-level posts have `parent_review_id` null; comments/replies have `parent_review_id` set to the parent review UUID. Rows include `likes_count`, `replies_count` (denormalized).
- **Likes** — Table `restaurant_review_likes(review_id, user_id)` with unique constraint `restaurant_review_likes_unique`. A DB trigger (e.g. `update_review_likes_count()`) keeps `restaurant_reviews.likes_count` in sync when likes are inserted/deleted.
- **Feed query** — Only top-level reviews (`parent_review_id` null). Comments are not nested in the feed; they are loaded on-demand per review.

### Like (write path)

- **API:** `POST /api/v1/restaurant-reviews/toggle-like` (body: `review_id`, `user_id`). UUIDs required. Rate limited: 20 requests / 10s per user (Redis `likeRateLimit`).
- **Server flow:** (1) One combined Hasura query: check if user liked + read current `likes_count`. (2) If liked → `DELETE_REVIEW_LIKE`; else → `INSERT_REVIEW_LIKE` (with `on_conflict` on unique constraint). (3) Read `likes_count` from `restaurant_reviews_by_pk`. (4) If trigger did not update count (self-heal logic), run aggregate count once and optionally update `likes_count` so future reads stay fast.
- **Response:** `{ success, data: { liked, action, likesCount } }`.
- **Client:** **useReviewLike** (where wired): Optimistic update → `reviewV2Service.toggleLike(reviewId, userId)` (POST JSON). On success confirm from API; on error revert + toast. No success toast. **ReviewScreen, ReviewScreenDesktop, ReviewBlock:** Some call `reviewV2Service.toggleLike` or `fetch(.../toggle-like...)` directly with local optimistic state.
- **Like status read:** `GET .../toggle-like?review_id=&user_id=` returns `{ data: { liked, likesCount } }` (existence check + denormalized count).

### Comments (write path)

- **API:** `POST /api/v1/restaurant-reviews/create-comment` (body: `parent_review_id`, `author_id`, `content`, optional `restaurant_uuid`). Rate limited: 5 requests / 30s per user. UUID validation; content length 1–1000.
- **Server flow:** If `restaurant_uuid` missing, fetch parent review to get it. Insert via `CREATE_REVIEW` with `{ restaurant_uuid, author_id, content, status: 'approved', parent_review_id }`. After success, `bumpVersion(\`v:review:${parent_review_id}:replies\`)` for cache invalidation.
- **Client:** `ReviewService.createComment(input, accessToken)` → fetch create-comment. Used from ReviewScreenDesktop and CommentsBottomSheet. No optimistic comment insert in the paths checked; UI waits for success then refetches replies.

### Reviews feed (read path)

- **API:** `GET /api/v1/restaurant-reviews/get-all-reviews?limit=&offset=` (default limit 16, offset 0). Uses **offset pagination** in this route. Cache: versioned key, TTL 300s, version `v:reviews:all`.
- **Server flow:** (1) Hasura `GET_ALL_REVIEWS_WITH_NHOST_AUTHORS` (reviews only). (2) Batch-fetch restaurants by UUID. (3) Enrich with author (AuthorProfile/user) and restaurant. Return `{ data: enrichedReviews, meta: { total, limit, offset, hasMore } }`.
- **Replies read:** `GET .../get-replies?parent_review_id=&user_id=` (user_id optional for viewer_has_liked). Cached with `v:review:{parent_review_id}:replies`, TTL 120s. Comments loaded on-demand when opening a review.

### Where things live in code

| Concern | Location |
|--------|----------|
| Toggle like API | `src/app/api/v1/restaurant-reviews/toggle-like/route.ts` |
| Create comment API | `src/app/api/v1/restaurant-reviews/create-comment/route.ts` |
| Get all reviews (feed) | `src/app/api/v1/restaurant-reviews/get-all-reviews/route.ts` |
| Get replies | `src/app/api/v1/restaurant-reviews/get-replies/route.ts` |
| Like hook (optimistic) | `src/hooks/useReviewLike.ts` |
| Like service (client) | `src/app/api/v1/services/reviewV2Service.ts` (`toggleLike` POST body) |
| Comment service (client) | `src/services/Reviews/reviewService.ts` (`createComment`) |
| GraphQL (likes, reviews) | `src/app/graphql/RestaurantReviews/restaurantReviewQueries.ts` |

### Assessment vs. modern SNS checklist

- **Cursor pagination:** Feed in `get-all-reviews` is offset-based (cursor may exist elsewhere; see Performance.md).
- **Stored counters:** Yes — `likes_count` / `replies_count` on `restaurant_reviews`; trigger + API self-heal.
- **Unique constraint for likes:** Yes — `restaurant_review_likes_unique`; INSERT uses `on_conflict`.
- **Existence check for viewer_has_liked:** Yes — `restaurant_review_likes` limit 1, not aggregate.
- **Comments on-demand:** Yes — get-replies; not nested in feed.
- **Transactional like + counter:** Counter by DB trigger; API does insert/delete then read count (no single DB function).
- **Optimistic UI for like:** Yes — useReviewLike and direct call sites.
- **No refetch entire feed after like:** Yes — only affected post state updated.
- **Write path behind monolith API:** Yes — likes and comments via Next.js routes (rate limit, validation, cache invalidation).
- **No success toast on like:** Yes.
- **Idempotency:** Not implemented for like or create-comment.

---

## 1) What your stack *should* look like (clean separation)

### A. Next.js (Client + Server)

* **Client UI (React)**: renders feed, handles optimistic likes, comment composer, infinite scroll.
* **Server (Next.js Route Handlers / Server Actions)**: used for

  * **Edge caching / revalidation**
  * **BFF** (backend-for-frontend) aggregation if Hasura queries are too expensive or too flexible.

### B. Hasura (GraphQL over Postgres)

* Great for CRUD + permissions + relationships.
* But modern “SNS” needs:

  * **precomputed feed**
  * **counters**
  * **denormalized views**
  * **event-driven updates**
    …because raw relational joins at scale get slow fast.

### C. Monolith API (your app backend)

This is where modern teams put things that are *not* “simple CRUD”:

* feed generation/ranking
* write paths (like, comment) with idempotency
* anti-spam / abuse rules
* fanout (notifications)
* cache invalidation
* background jobs

If you’re currently letting the client write directly to Hasura for everything, you’ll often get “correct but sluggish” behavior.

---

## 2) Modern SNS pattern: read path ≠ write path

### The key idea

**Writes go to a fast, controlled path. Reads come from optimized, cached, precomputed data.**

### Write path (Like / Comment / Reply)

Modern pattern:

1. Client immediately updates UI (**optimistic update**)
2. Backend confirms + resolves conflicts
3. Real-time events notify others (subscriptions/WebSocket)
4. Counters & derived data update async if needed

### Read path (Feed)

Modern pattern:

1. Fetch a **feed page** that’s already shaped for the UI (minimal joins)
2. Use **cursor pagination**
3. Cache aggressively (CDN/server cache)
4. Stream/partial render to make it *feel* instant

---

## 3) Why your “likes don’t feel real-time” (common causes)

### Cause A — no optimistic UI

If you wait for Hasura mutation + refetch to complete before toggling the heart icon → it will always feel laggy.

**Fix:** optimistic update locally, then reconcile.

### Cause B — refetching the whole post/feed after each like

Common with GraphQL clients: mutate → refetchQueries → re-render big list.

**Fix:** update only the specific post in the client cache (or local state) and avoid full refetch.

### Cause C — like count computed from joins

If your UI queries `likes_aggregate { count }` for every post, plus comments aggregates… that’s expensive.

**Fix:** store counters on the post row (or a separate counters table) and update them.

### Cause D — pagination strategy is expensive

Offset pagination on big tables is slow and causes jitter.

**Fix:** cursor-based pagination (`created_at`, `id`) + proper indexing.

---

## 4) Step-by-step: how “modern companies” build this (and how you can mirror it)

### Step 1 — Data model designed for speed (Postgres)

**Core tables**

* `posts(id, author_id, body, media..., created_at, visibility, like_count, comment_count)`
* `post_likes(post_id, user_id, created_at)` with unique constraint `(post_id, user_id)`
* `comments(id, post_id, author_id, parent_id NULLABLE, body, created_at, like_count)`
* `comment_likes(comment_id, user_id, created_at)` unique `(comment_id, user_id)`

**Why counters matter**

* Feed query becomes “fetch posts + counters” (fast)
* Avoids `aggregate count()` per row

**Indexes (minimum)**

* `posts(created_at desc, id desc)`
* `post_likes(post_id, user_id)` unique index
* `comments(post_id, created_at, id)`
* `comments(parent_id, created_at, id)` for replies

---

### Step 2 — Make the feed query cheap

Modern companies avoid “load everything with nested relationships” in one request.

**Feed page returns:**

* post core fields
* author basic profile (denormalized or cached join)
* `like_count`, `comment_count`
* “viewer_has_liked” (exists check, not aggregate)

Then:

* comments are fetched **on-demand** when opening a post.

---

### Step 3 — Real-time feel: optimistic UI + reconciliation

**Like UX pattern**

1. User taps like
2. UI immediately toggles state + increments count
3. Send mutation
4. If success: keep
5. If fail: rollback

This single change often makes the app feel 10x faster even if the backend is unchanged.

---

### Step 4 — Put write operations behind a “Like API”

Even if Hasura can mutate directly, modern teams often centralize writes:

**Your monolith handles:**

* idempotency (double taps, retries)
* rate limits / spam
* transaction correctness (insert like + update counter atomically)
* emits an event (`post.liked`) for subscriptions/notifications

Then Hasura is primarily your read layer (and CRUD for less sensitive parts).

---

### Step 5 — Event-driven updates (optional but very “SNS”)

For “other users seeing it update”:

* Hasura subscriptions can work if you keep payloads small and indexes right.
* For scale, many companies move to:

  * event bus (Kafka/SNS/SQS/NATS)
  * websocket gateway
    But you can get 80% of the feel just with optimistic UI + light subscriptions.

---

### Step 6 — Caching & streaming (Next.js)

Modern “smooth feed” is as much frontend delivery as backend correctness.

**What to do**

* Use Next.js App Router + server components for initial feed shell
* Stream content (skeletons + progressive list)
* Cache feed pages at the edge when possible (public feeds)
* Use client-side infinite scroll for subsequent pages

If your feed is personalized-per-user, cache “lightly”:

* cache the first page for short TTL (5–30s)
* revalidate in background

---

## 5) Concrete checklist to cross-check against your current build

### Backend / DB

* [ ] Cursor pagination, not offset
* [ ] Post row stores `like_count`, `comment_count`
* [ ] Unique constraint on `(post_id, user_id)` for likes
* [ ] Existence check for `viewer_has_liked` (not aggregate)
* [ ] Comments loaded on-demand (not nested deep in feed query)
* [ ] Transactional like/unlike handling (insert/delete + counter update)

### Hasura

* [ ] Queries avoid huge nested joins
* [ ] Aggregates minimized on feed
* [ ] Proper permission rules don’t cause accidental full scans
* [ ] Subscriptions are small + selective (don’t stream giant objects)

### Next.js / UI

* [ ] Optimistic UI for like/comment
* [ ] No “refetch entire feed” after every mutation
* [ ] Virtualized list for long feeds (helps a lot for smoothness)
* [ ] Prefetch next page + skeleton UI

---

## 6) If you want the fastest “big win” order (high ROI)

1. **Optimistic UI** for likes/comments (instant feel)
2. Replace `aggregate count()` with **stored counters**
3. Switch feed pagination to **cursor-based**
4. Stop fetching nested comments in the feed
5. Add list **virtualization** for smooth scrolling
6. Move likes/comments write path to **monolith API** (idempotent + transactional)
7. Add subscriptions only where it matters (post detail / comment thread)

---

If you paste (1) your current Hasura feed query shape and (2) how you’re handling like mutations in Next.js (client state + refetch behavior), I can point out exactly where the slowness is coming from and give you a “before/after” architecture that still fits Nhost + Hasura cleanly.
