# Priority 1 — Unify the like path into one consistent client pattern

Your doc shows that some parts of the UI use `useReviewLike`, while other parts still call `reviewV2Service.toggleLike` or `fetch(.../toggle-like...)` directly with their own local logic . That’s one of the easiest ways for a product to feel inconsistent and laggy.

## Why this matters

When different screens implement likes differently, you usually get:

* different optimistic timing
* duplicate network behavior
* inconsistent rollback logic
* unnecessary rerenders
* mismatched cache state between feed/detail/modal components

That means one screen feels “fast enough,” another screen feels delayed, and a third one sometimes jumps count values after the server responds.

## What “good” should look like

Every like action in the app should go through one reusable hook or state layer.

That single abstraction should handle:

* optimistic toggle
* lock/debounce while request is in flight
* rollback on failure
* reconciliation with server truth
* cache patching for every place that same review appears

## Recommended structure

### Client hook

Create one canonical hook such as:

* `useReviewLike(reviewId, initialLiked, initialLikesCount)`

This hook should expose:

* `liked`
* `likesCount`
* `toggleLike()`
* `isPending`

And it should be the only way the UI interacts with likes.

### Internal behavior

When `toggleLike()` runs:

1. Capture previous state
2. Immediately update local state
3. Mark request as pending
4. Send one API request
5. On success, replace local state with server response
6. On failure, revert to previous state

## Important detail: prevent rapid double-tap chaos

Even with optimistic UI, you should not let a user generate a messy chain of like/unlike/like/unlike requests faster than the UI can reconcile.

Use one of these:

* temporary input lock for that review while request is pending
* client-side queue
* last-write-wins model

For your case, a temporary lock is simplest and cleanest.

## Recommended app-level cache strategy

If the same review appears in:

* home feed
* restaurant detail page
* comment bottom sheet
* user profile review list

…then a like update should patch all those cached instances together.

If you do not centralize this, the user gets weird moments where:

* the feed says 12 likes
* the detail screen says 11 likes
* reopening the modal suddenly changes it to 13

That feels broken even if your backend is correct.

## Best-practice implementation notes

* never refetch the whole feed after a like
* only patch the affected review object
* memoize review card components so one like does not rerender the whole list
* keep the optimistic state local but reconcile server truth immediately after response

## What success looks like

When the user taps the heart:

* the icon changes instantly
* the count updates instantly
* there is no spinner blocking interaction
* the card does not jump
* other cards do not rerender unnecessarily

That is how the app starts feeling “native” instead of “webby.”

Your document already points toward this pattern with optimistic UI for likes and avoiding full-feed refetches; the missing piece is consistency across every surface  

---

# Priority 2 — Move feed pagination from offset to cursor pagination

Your checklist explicitly calls out cursor pagination as the better target and warns against offset pagination .

## Why offset becomes painful

Offset pagination seems easy at first:

* page 1 = offset 0
* page 2 = offset 20
* page 3 = offset 40

But for a social feed, it causes real problems:

### Performance problem

As the table grows, the database has to skip more rows before returning results. That gets slower page by page.

### UX problem

If new reviews are inserted while the user scrolls, offset paging can:

* duplicate rows
* skip rows
* shift results unpredictably

That creates “feed jitter,” which users absolutely feel.

## What cursor pagination should look like

Use a stable sort order like:

* `created_at DESC`
* secondary tie-breaker: `id DESC`

Then send back a cursor based on the last item.

Example shape:

* first request: no cursor
* response: 20 reviews + `nextCursor`
* next request: fetch reviews where `(created_at, id) < cursor`

## Why this is better

Cursor paging gives you:

* stable scrolling
* better DB performance
* fewer duplicates/missing rows
* smoother infinite loading

## DB/index requirements

Your doc already suggests minimum indexing patterns for this style of feed access, including indexes around `created_at` and `id` for ordered retrieval .

For your current review feed, you want at least:

* top-level reviews indexed by `(created_at desc, id desc)`
* replies indexed by parent and created time
* likes indexed by `(review_id, user_id)`

## Implementation advice for your stack

Since your feed only returns top-level reviews and replies load on demand, cursor pagination is a very good fit .

### Good API shape

For example:

`GET /api/reviews/feed?cursor=...&limit=20`

Response:

* `items`
* `nextCursor`
* `hasMore`

### Frontend behavior

Use infinite scroll or “load more,” but always append based on cursor, never recalculate with page numbers.

## Extra win: prefetch next page

Once the current page is rendered and the user scrolls near the bottom, prefetch the next cursor page in the background.

This improves perceived speed a lot because the user feels like the feed is just “there.”

## What success looks like

* the first page loads fast
* scrolling does not stutter
* loading more content does not cause jumps
* new posts do not mess up what the user is already seeing

---

# Priority 3 — Make comments and replies optimistic, not wait-for-server

Your document says comments currently go through the monolith API, but the checked paths do not use optimistic insert; the UI waits for success and then refetches replies .

This is a huge reason comments feel sluggish.

## Why comment UX feels worse than likes

A like is small and binary. A comment is emotionally heavier. The user typed something and expects it to appear immediately.

If they hit “send” and then wait for:

* network request
* server insert
* cache invalidation
* reply refetch
* rerender

…it feels slow and slightly broken, even if the total latency is only 500–900ms.

## What modern comment UX should do

The moment the user submits:

1. Insert a temporary comment into local UI immediately
2. Mark it as `sending`
3. Increment local reply/comment count immediately
4. Send the API request
5. Replace temporary comment with real server comment on success
6. Show retry/failure state on error

## Temporary comment model

A temporary comment can have:

* temporary client id
* `pending: true`
* author info from local session
* raw text content
* current timestamp

That is enough to render it naturally.

## Why this matters

This removes the worst part of the user experience:
the feeling that their action did not register.

Instead, the UI says:
“Yep, got it — we’re sending.”

That tiny confidence boost changes the entire perception of app quality.

## Important implementation detail

Do not refetch the entire comment thread after each comment unless you need to.

Better pattern:

* insert locally
* on success, reconcile only the new comment
* optionally background refresh the thread later

## Failure handling

If comment creation fails:

* keep the failed comment in place
* mark it as “failed to send”
* let the user retry

Do not just silently remove it. That feels brutal.

## Count consistency

Since your system already uses denormalized `replies_count` / `likes_count`, optimistic comments should also optimistically adjust the count locally, then reconcile with server truth later .

## What success looks like

When the user submits a comment:

* it appears instantly
* input clears immediately
* thread does not flash or fully reload
* reply count updates smoothly
* any eventual server correction is subtle

That is the difference between “functional comments” and “modern comments.”

---

# Priority 4 — Simplify the like write path into one transactional backend operation

Your current like write path is safe, but a bit chatty:

1. check whether user already liked
2. read current `likes_count`
3. insert or delete like
4. read `likes_count` again
5. self-heal with aggregate if trigger did not sync 

That works, but it adds round trips and complexity.

## Why this can feel slow

Every extra read/write step increases:

* DB latency
* server time
* chances of temporary mismatch
* code complexity during heavy interaction

If users are rapidly liking multiple reviews, small inefficiencies add up fast.

## Better target design

The like API should do one atomic unit of work and return final truth.

You want one backend operation that:

* determines current state
* inserts or deletes like
* updates count
* returns `{ liked, likesCount }`

all in one transaction.

## Why atomic matters

A transactional write prevents weird states like:

* like row inserted but count not updated
* count updated twice by retry
* race conditions from simultaneous taps
* temporary stale values during reconciliation

## Suggested database approach

Since you’re already on Postgres behind Hasura/Nhost, this is exactly the kind of operation that should live in:

* a SQL function
* or a monolith-managed transaction

Your monolith API remains the entry point, but the DB should do the state transition atomically.

## Trigger vs explicit transactional update

Your document mentions a trigger maintaining `likes_count` and also fallback self-healing logic when the trigger did not update correctly .

That is workable, but for an interaction-heavy app, explicit transactional update logic is often easier to reason about.

### Good option

Use a transaction that:

* inserts/deletes from `restaurant_review_likes`
* updates `restaurant_reviews.likes_count`
* returns the final count

### Better observability

This makes it easier to log:

* latency
* conflict rate
* retries
* duplicate request behavior

## Minimize backend payloads

The response should stay tiny:

* `success`
* `liked`
* `likesCount`

Do not send huge hydrated objects back from like endpoints.

This is a micro-interaction. Keep it tiny.

## What success looks like

* one tap = one cheap request
* one request = one transaction
* one response = authoritative truth
* count never jumps strangely
* backend logs are easy to trace

---

# Priority 5 — Add idempotency for likes and comment creation

Your document clearly states idempotency is not yet implemented for likes or create-comment . This is one of those things people postpone until the product gets flaky under real use.

## Why idempotency matters

Without idempotency, these situations create messy behavior:

* user double taps because UI feels delayed
* browser retries after transient failure
* mobile network reconnects and resends
* user opens two tabs
* request times out but actually succeeded server-side

Then the frontend thinks:
“Did that work? Let me try again.”

And now your backend may process a duplicate action.

## Likes and idempotency

Likes are a little special because they are toggle-based.

There are two ways to think about this:

### Option A — keep “toggle-like”

If the endpoint means “flip current state,” idempotency gets trickier because the same request replayed twice may produce opposite outcomes.

### Option B — switch to explicit intent

This is cleaner.

Use:

* `PUT /reviews/:id/like`
* `DELETE /reviews/:id/like`

Now the client sends clear intent:
“make this liked” or “make this unliked.”

That makes idempotency much easier.

Replay the same `PUT` twice?
Result should still be “liked.”

Replay the same `DELETE` twice?
Result should still be “not liked.”

This is one of the biggest hidden design upgrades you can make.

## Comments and idempotency

Comments benefit even more.

When the user submits a comment, include a client-generated idempotency key such as:

* UUID per submit action

The server stores that key for a short period along with the resulting comment id.

If the same request is retried, the server returns the already-created result instead of inserting a duplicate.

## Good pattern for your monolith

Since your monolith already handles rate limiting and validation on write paths, it is the right place to enforce idempotency too  .

For example:

* client sends `Idempotency-Key`
* server checks idempotency store
* if seen before, return previous result
* if not, process and persist result

## Storage options

For short-lived idempotency, Redis is usually enough.

For stronger guarantees, store it in Postgres.

Given your stack, Redis for short TTL plus DB uniqueness constraints is a practical combo.

## Why this improves UX too

Idempotency is not just backend correctness. It improves feel.

Because now you can confidently let the UI retry failed requests without fear of duplication.

That means:

* smoother offline-ish behavior
* better resilience under slow networks
* fewer weird duplicate comments
* safer optimistic patterns

## What success looks like

* retries do not create duplicate comments
* double taps do not produce count glitches
* network instability does not corrupt interaction state
* your logs become much easier to trust

---

# Best order to implement these in the real world

If you want the highest ROI sequence for your app, I’d do it in this order:

## Phase 1 — fastest perceived performance win

1. unify all likes behind one hook
2. stop full refetches after like
3. add pending lock for like button
4. make comments optimistic

## Phase 2 — backend correctness + scale

5. move like operation to one transaction
6. add explicit like/unlike endpoints instead of pure toggle
7. add idempotency keys for comments
8. add idempotency or explicit-intent safety for likes

## Phase 3 — feed smoothness

9. migrate feed from offset to cursor
10. prefetch next page
11. memoize review cards / virtualize long lists

---

# My honest read on your system

You are not far off. The architecture is already pointing in the right direction:

* controlled writes through monolith
* counters on rows
* comments on demand
* optimistic likes in some paths   

The lag you feel is likely coming from the last 20%:

* inconsistent client handling
* too much reconciliation/refetch
* offset feed paging
* non-optimistic comment flow
* non-idempotent mutation behavior under repeated interaction

Fix those, and the product will feel dramatically more polished without needing a completely different stack.

Send me your current feed query shape plus the `useReviewLike` or toggle-like client code, and I’ll turn this into a concrete “before/after implementation blueprint” for your exact app.
