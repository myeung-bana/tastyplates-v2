# Technical Refactor PRD

## Review, Like, and Comment Performance Optimization

## 1. Document Purpose

This document defines the refactor required to improve the performance, responsiveness, and maintainability of the review engagement system across:

* review feed
* review viewer
* like interactions
* comment counts
* comment threads
* reply likes

The current implementation is functional, but it is not optimized for fast perceived performance. It relies on redundant requests, duplicated logic paths, and client-side “repair” fetching after initial render, which leads to slow loading and inconsistent interaction behavior. 

This refactor is intended to:

* reduce network redundancy
* reduce render-blocking work
* improve interaction latency
* simplify frontend state management
* align the app closer to high-performance social feed patterns

---

# 2. Executive Summary

## Current Diagnosis

The present review system has four major structural issues:

### A. The viewer re-fetches engagement truth after render

The review viewer renders using feed snapshot data, then performs background sync requests for like state and counts. This creates extra network work on open and causes UI state correction after first paint. 

### B. Comment counts are computed inefficiently

Comment count is currently obtained by fetching the entire replies list and using `.length`, rather than reading a dedicated count field. Desktop may fetch replies once for count and again for full thread loading; mobile may fetch them for preview and then again in the bottom sheet. 

### C. Mobile and desktop implement engagement behavior differently

Desktop uses a dedicated like hook; mobile uses inline logic with fallback behavior. This introduces logic drift, inconsistent performance, and harder maintenance. 

### D. Too much non-critical work competes with critical interaction paths

Follow status checks, image preload, animation handling, and engagement sync all occur around the same time, increasing pressure on the network and main thread. 

---

# 3. Problem Statement

Users expect review interactions to feel as fast as modern social apps. Today, the system does not meet that expectation because:

* review open performs extra background requests
* comment counts are too expensive to calculate
* the same replies may be fetched multiple times
* like logic is duplicated and inconsistent
* state is fragmented across feed, viewer, and comments components
* engagement data is not sufficiently denormalized for fast reads

As a result, users experience:

* slow review open
* delayed engagement state updates
* visible UI corrections after load
* inconsistent like/comment behavior across surfaces
* poor scalability as review volume increases

---

# 4. Goals

## Primary Goals

* Make review cards and viewer open fast without repair-fetching engagement state
* Make likes and comment counts appear instantly from feed payload
* Fetch full comment threads only when explicitly needed
* Remove duplicate fetching across preview, count, and thread paths
* Standardize mobile and desktop interaction logic
* Reduce code complexity and maintenance burden

## Secondary Goals

* Improve caching and state consistency across surfaces
* Reduce API request volume per session
* Improve observability for performance bottlenecks
* Create a foundation for future features like live counts and smarter prefetching

## Non-Goals

* Full redesign of review UI
* Replacing the backend stack entirely
* Rebuilding feed ranking logic
* Real-time websockets in phase 1

---

# 5. Current-State Findings

## 5.1 Viewer relies on feed snapshot then background sync

The first render uses `review.userLiked` and `review.commentLikes`, then the viewer performs background like sync calls for logged-in users. Desktop syncs the current review; mobile syncs initial index ±1. This adds avoidable network work to viewer open. 

### Critical Assessment

This is the wrong architecture for a social interaction surface.
The viewer should not open and then ask, “what is the real state?”
The feed payload itself should already be authoritative enough for fast interaction.

---

## 5.2 Comment count path is fundamentally inefficient

There is no lightweight count endpoint. Full replies are fetched purely to compute `replies.length`. Desktop may do this for visible cards and then fetch the active thread again. Mobile fetches replies for preview and again when comments are opened. 

### Critical Assessment

This is the single most obvious structural waste in the current system.
Fetching full comments to show “12 comments” is not acceptable at scale.

---

## 5.3 Like logic is split across code paths

Desktop uses `useReviewLike`; mobile uses `handleLike`; reply likes are separately handled in-component. There is also legacy branching for non-UUID IDs. 

### Critical Assessment

This makes bugs more likely and optimization harder.
Interaction logic should not vary by viewport.

---

## 5.4 There is too much concurrent work near first interaction

The document notes follow-status checks, image preloading, wheel/spring animation, comment loading, and engagement sync all operating in the same experience window. 

### Critical Assessment

The app is spending resources on “nice to have” behavior before stabilizing “must feel instant” behavior.

---

# 6. Root Causes

## Backend/Data Model Root Causes

* No denormalized `replies_count` on review records
* Feed APIs do not guarantee fresh enough engagement fields
* Engagement read path is not optimized around list-view consumption
* Review and reply state is not consistently shaped for frontend use

## Frontend Architecture Root Causes

* Feed and viewer do not share one canonical cached source of truth
* Same resource is fetched through multiple component-local flows
* Viewport-specific logic duplicates business rules
* Comments preview/count/thread loading are coupled poorly

## Product/UX Root Causes

* The system optimizes for correctness via follow-up fetches instead of fast perceived load
* Too much work happens before the user explicitly requests deeper detail
* Comment count is treated as derived view state instead of core entity metadata

---

# 7. Target Architecture

## 7.1 Feed payload becomes engagement-authoritative

Every review returned in the feed and viewer entry paths must include:

* `id`
* `databaseId`
* `likes_count`
* `user_liked`
* `replies_count`
* optional `top_reply_preview`
* optional `top_reply_preview_author`
* optional `top_reply_preview_created_at`

This removes the need for viewer-open repair sync in normal flows.

---

## 7.2 Separate summary data from thread data

Two different read models are required:

### Review Summary Model

Used for cards, feed, viewer carousel, and counts.
Includes:

* review content
* media
* author
* likes_count
* user_liked
* replies_count

### Comment Thread Model

Used only when user opens the thread.
Includes:

* replies array
* reply authors
* reply like counts
* reply user liked state
* pagination metadata

These should not be conflated.

---

## 7.3 Use a shared client query layer

Adopt a shared cache strategy using React Query or SWR.

Recommended query keys:

* `['review-summary', reviewId]`
* `['review-thread', reviewId]`
* `['review-like-state', reviewId, userId]` only if ever needed as fallback
* `['follow-status', authorId]`

All surfaces must read/write through this cache rather than maintain separate local truth.

---

## 7.4 Likes become a single unified interaction service

One shared hook/service should handle:

* optimistic toggle
* rollback
* cooldown
* analytics
* cache update
* feed and viewer sync

This should apply to:

* review likes
* reply likes

There should be one logic pattern, not three.

---

## 7.5 Comments load on demand

Rules:

* show `replies_count` immediately from feed payload
* do not fetch replies to calculate counts
* fetch full thread only when user opens comments
* optional preview should come from summary payload, not thread fetch
* use pagination for thread replies if long

---

# 8. Functional Requirements

## 8.1 Review Feed and Viewer

### Requirements

1. The feed must render likes and comment counts from API payload without additional fetches.
2. Opening the viewer must not trigger per-review engagement repair fetches in the normal path.
3. Feed and viewer must share the same review summary state.
4. If an optimistic like is made in the viewer, the feed and viewer must update together.
5. If an optimistic like fails, the state must roll back visibly and correctly.

### Acceptance Criteria

* Viewer open requires no like-status fetch in steady-state operation
* Review engagement state is visible immediately on first paint
* Feed and viewer do not show mismatched counts after like toggle

---

## 8.2 Comment Count

### Requirements

1. `replies_count` must be returned in all review list and single-review APIs.
2. Comment counts must not require `fetchCommentReplies()` for calculation.
3. Comment count must update after successful create/delete reply actions.

### Acceptance Criteria

* Review cards and viewer can display comment counts without fetching full replies
* No network request is made solely for count display
* Counts remain accurate after reply write operations

---

## 8.3 Comment Thread

### Requirements

1. Full replies must only be fetched when comments are explicitly opened.
2. Thread data must be cached by review ID.
3. Re-opening the same comment thread should use cached data until invalidated or stale.
4. Reply like state must update through shared cache mutation logic.
5. The thread endpoint should support pagination for scalability.

### Acceptance Criteria

* Opening comments on an already-opened review is faster on second open
* Thread loading does not impact count rendering
* Large reply threads do not block first comment render

---

## 8.4 Like Interaction

### Requirements

1. There must be one shared like interaction pattern for mobile and desktop.
2. There must be one shared payload contract for review and reply likes.
3. Like toggling must be optimistic by default.
4. Cooldown and double-tap protection must be preserved.
5. Legacy branching for non-UUID IDs must be removed or isolated behind a compatibility adapter.

### Acceptance Criteria

* Mobile and desktop produce the same like behavior
* Review and reply likes update consistently
* There is one source of interaction truth for likes

---

## 8.5 Authentication and Request Efficiency

### Requirements

1. User UUID resolution must be cached at session/app level.
2. Access token retrieval must be centralized through a shared API client.
3. Engagement actions must not perform repeated identity resolution per interaction.

### Acceptance Criteria

* Like action path does not repeatedly resolve user ID/token through duplicate calls
* Network waterfall for engagement actions is materially reduced

---

# 9. Technical Requirements

## 9.1 Backend / Data Layer Changes

### Required Fix 1: Add denormalized `replies_count`

Add a `replies_count` field to `restaurant_reviews`.

### Required Fix 2: Ensure `likes_count` and `user_liked` are included everywhere

All review list APIs must consistently return:

* `likes_count`
* `user_liked`
* `replies_count`

### Required Fix 3: Update counts on write

On create/delete reply:

* increment/decrement `replies_count`

On review like toggle:

* maintain correct `likes_count`

On reply like toggle:

* maintain reply `likes_count`

### Required Fix 4: Add summary-oriented endpoint shape

Even if the feed uses the same endpoint, the server response contract must explicitly distinguish summary data from thread data.

### Required Fix 5: Support thread pagination

Thread fetch endpoint should not assume unbounded full-load forever.

---

## 9.2 Frontend Changes

### Required Fix 1: Introduce query cache layer

Implement React Query or SWR for:

* review summaries
* review threads
* follow status
* optionally author summary data

### Required Fix 2: Remove background like repair sync from viewer open

Fallback sync may exist only for stale recovery, debugging, or edge cases, not standard flow.

### Required Fix 3: Replace comment count fetches

Remove all code paths where comment count is derived from full reply fetches.

### Required Fix 4: Unify like hooks

Create:

* `useToggleReviewLike`
* `useToggleReplyLike`

These should share a lower-level mutation service.

### Required Fix 5: Rework comment preview strategy

If comment preview is needed, it should come from:

* feed summary payload
  or
* cached thread snippet

Not from full thread fetches just to display a teaser.

### Required Fix 6: Defer non-critical work

De-prioritize or lazily schedule:

* follow-status fetch
* non-critical image preload
* heavy animation side effects
  until after core review content is interactive

---

# 10. Proposed Data Contract

## Review Summary Response

```json
{
  "id": "uuid",
  "databaseId": 12345,
  "author": {
    "id": "uuid",
    "name": "string",
    "avatar": "string"
  },
  "content": "string",
  "reviewImages": [],
  "likes_count": 18,
  "user_liked": true,
  "replies_count": 6,
  "top_reply_preview": {
    "id": "uuid",
    "author_name": "string",
    "content": "string",
    "created_at": "timestamp"
  }
}
```

## Review Thread Response

```json
{
  "review_id": "uuid",
  "replies": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "name": "string",
        "avatar": "string"
      },
      "content": "string",
      "likes_count": 3,
      "user_liked": false,
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "next_cursor": "string|null",
    "has_more": false
  }
}
```

---

# 11. Critical Refactor Recommendations

## 11.1 Must Fix Now

These are not optional if you want a visibly faster product.

### 1. Stop using full reply fetches for comment counts

This is wasteful and should be removed first.

### 2. Make feed payload authoritative for engagement

Your viewer should not be correcting truth after opening.

### 3. Eliminate duplicate mobile/desktop like implementations

One code path only.

### 4. Add a shared query cache

Without a shared cache, you will keep re-solving the same problem in different components.

---

## 11.2 Should Fix Next

### 5. Reduce first-interaction competition

Push follow checks and non-critical preloads later.

### 6. Clean up naming

The document notes `commentLikes` is misleading if it actually stores review like counts. That is a maintenance smell and should be corrected. 

Recommended rename:

* `commentLikes` → `reviewLikesCount`

### 7. Remove legacy ID branching from hot paths

UUID vs non-UUID logic in core interaction flows should be phased out.

---

# 12. Rollout Plan

## Phase 1 — Data Contract and Backend Fixes

Deliver:

* `replies_count`
* consistent `likes_count`
* consistent `user_liked`
* write-side count maintenance
* thread pagination support

Success measure:

* no count-only full reply fetches required anymore

---

## Phase 2 — Frontend Query and Interaction Refactor

Deliver:

* React Query / SWR integration
* shared review summary cache
* shared thread cache
* unified like mutation hook
* remove viewer-open like sync in standard flow

Success measure:

* viewer opens with no engagement repair requests

---

## Phase 3 — Comments Experience Refactor

Deliver:

* lazy thread loading only on open
* preview from summary payload or cache
* shared reply-like behavior
* invalidation/update strategy after comment create/delete

Success measure:

* no duplicate thread requests between preview, count, and thread view

---

## Phase 4 — Performance Hardening

Deliver:

* defer follow-status checks
* tune image preload
* reduce non-critical work near open
* add instrumentation and dashboards

Success measure:

* lower request count per viewer open
* lower time-to-interactive for viewer
* reduced user-perceived lag

---

# 13. Metrics to Track

## API Metrics

* average requests per review viewer open
* average requests per comment open
* percentage of duplicate replies fetches
* like toggle round-trip time
* thread endpoint response time

## Frontend Metrics

* time to first meaningful paint for review viewer
* time to interactive for like button
* time to comment thread visible
* cache hit rate for review thread
* UI rollback frequency after optimistic writes

## Product Metrics

* like success rate
* comment open rate
* comment post completion rate
* viewer abandonment rate
* session depth in review browsing

---

# 14. Risks

## Risk 1: Denormalized count drift

If write-side count maintenance fails, counts may become inaccurate.

Mitigation:

* background reconciliation job
* admin repair script
* strict transactional update logic

## Risk 2: Cache inconsistency

If optimistic writes are not designed carefully, feed/viewer/thread may diverge.

Mitigation:

* central mutation utilities
* strict query key strategy
* rollback handling

## Risk 3: Legacy compatibility issues

Removing old ID logic may break older content or paths.

Mitigation:

* isolate compatibility adapter
* phase out progressively
* instrument failures

---

# 15. Open Engineering Decisions

These need explicit decisions before implementation:

## A. Query library choice

* React Query recommended for mutation-heavy interaction surfaces
* SWR acceptable, but React Query is stronger for optimistic updates and invalidation control

## B. Count consistency strategy

* transactional write updates only
* or write updates plus periodic reconciliation job

## C. Preview strategy

* no preview at all until comments open
* or lightweight preview embedded in summary response

## D. Thread loading strategy

* full load on open for small threads
* paginated load for all threads
* hybrid threshold approach

---

# 16. Out of Scope for This Refactor

* live websocket updates for likes/comments
* redesign of review UI layout
* AI moderation or ranking changes
* full migration of every legacy review endpoint at once

---

# 17. Final Recommendation

If I am being blunt, your current review engagement implementation is behaving like a collection of component-level workarounds rather than a single optimized system.

The biggest underlying mistake is this:

**engagement summary data and comment thread data are being treated too similarly**, so the app keeps fetching heavy data for lightweight UI needs.

The correct fix is not a small tweak. It is a structural change:

* make summary data denormalized and authoritative
* fetch thread data only on intent
* unify interaction logic
* introduce a proper shared cache
* remove viewport-specific divergence
* stop doing expensive “truth repair” after render

That will give you:

* faster open
* less redundancy
* fewer requests
* simpler code
* more predictable behavior
* a much better base for future scale

---

If you want, I can next turn this into a more implementation-ready version with:

1. **engineering tasks by frontend/backend**
2. **database/schema changes**
3. **API contract changes**
4. **acceptance test checklist**
5. **migration plan by sprint**
