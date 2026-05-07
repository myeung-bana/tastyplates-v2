# AI Rules — tastyplates-v2-1

This file is the **single source of truth** for how this codebase must be developed.

Every rule below is grounded in what is **actually implemented** in the codebase today.
If any other document — old or new — conflicts with this file, **this file wins**.

---

## 1. Project invariants (non-negotiable)

- **Next.js App Router** is the routing model. All pages live in `src/app/`.
- **TypeScript everywhere.** `strict: true` is enabled. Do not introduce `any` to suppress errors — define the type properly.
- **No secrets in the browser.** `HASURA_GRAPHQL_ADMIN_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, and any backend-only env vars must never be prefixed with `NEXT_PUBLIC_` and must never be imported in client components.
- **No nested Express or standalone Node servers inside this repo.** The backend is the separate `tastyplates-backend` project. This repo is a Next.js frontend only.

---

## 2. Directory layout (enforced)

```
src/
├── app/                          # Next.js App Router (pages + API routes)
│   ├── (route-groups)/           # Parenthesized route groups for layout sharing
│   ├── api/v1/{resource}/        # BFF API route handlers
│   ├── graphql/                  # GraphQL query strings + Hasura client
│   └── layout.tsx                # Root layout (providers, Toaster, BottomNav)
├── components/
│   ├── ui/                       # Base UI primitives (Radix + shadcn-style)
│   ├── layout/                   # Navbar, Footer, BottomNav, MobileTopBar, etc.
│   ├── auth/                     # Auth wrappers and redirect guards
│   ├── tastystudio/              # TastyStudio-specific shared components
│   ├── seo/                      # StructuredData and SEO components
│   └── <feature>/                # Reusable feature components (review/, restaurant/, etc.)
├── hooks/                        # Custom hooks (useSession, useReviewLike, etc.)
├── lib/                          # Server + shared utilities (nhost.ts, redis-cache.ts, utils.ts, etc.)
├── services/                     # Auth + follow service wrappers
├── contexts/                     # React context providers (UploadContext, etc.)
├── constants/                    # App constants (pages.ts, featureFlags.ts, etc.)
├── types/                        # Shared TypeScript interfaces
├── interfaces/                   # Domain interfaces (restaurant, review, user)
├── utils/                        # Pure utility functions (toast.ts, addressUtils.ts, etc.)
└── repositories/                 # HTTP repository layer (reviewRepository, etc.)
```

### Colocated page components

Page-specific components go in `_components/` next to the page file:

```
src/app/tastystudio/add-review/
├── _components/
│   └── ReviewFormClient.tsx
└── page.tsx
```

---

## 3. Authentication (non-negotiable)

### Client-side session

- **Always use `src/hooks/useSession.ts`** for component-level auth access. Never reach directly into Firebase or Nhost hooks in a feature component — always go through `useSession`.
- `useSession()` returns `{ user, authUser, loading, error }`.
- `useAuth()` (also in `useSession.ts`) returns `{ isAuthenticated, user, authUser, loading }` — use this for simple auth guards.

### Default auth provider

- **Nhost is the default** (`NEXT_PUBLIC_USE_NHOST=true` or unset).
- Firebase paths are only active when `NEXT_PUBLIC_USE_NHOST=false`. Do not write new code that reaches Firebase directly except behind this flag.

### Getting an access token in client code

- Use `getAccessToken()` from `src/hooks/useSession.ts`. Do not call `nhost.auth.getAccessToken()` directly from feature components.

### Server-side token verification

- Use `verifyNhostToken(authHeader)` or `getNhostUserId(authHeader)` from `src/lib/nhost-server-auth.ts`.
- The pattern in every protected route handler:
  ```typescript
  const authHeader = request.headers.get('authorization');
  const userId = await getNhostUserId(authHeader);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  ```

### Identity rule

All auth-derived identity must come from the active session or verified JWT — never from a user-supplied body/query parameter.

---

## 4. API route conventions (`src/app/api/v1/`)

### Directory naming

```
src/app/api/v1/{resource}/{verb}-{resource}/route.ts
```

Examples:
- `restaurant-reviews/get-all-reviews/route.ts` — GET list
- `restaurant-reviews/create-review/route.ts` — POST
- `restaurant-reviews/toggle-like/route.ts` — POST

### Response envelope (always)

**Success:**
```json
{ "success": true, "data": { ... }, "meta": { "limit": 16, "hasMore": true, "cursor": "..." } }
```

**Error:**
```json
{ "success": false, "error": "Human-readable message" }
```

Every route handler must return this shape — no naked data arrays, no ad-hoc fields.

### Route handler structure (standard pattern)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // 1. Parse + validate params
    // 2. Run Hasura query via hasuraQuery()
    // 3. Check result.errors → return 500 if present
    // 4. Return NextResponse.json({ success: true, data: ..., meta: ... })
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### HTTP status codes

| Code | When |
|------|------|
| 200 | Successful GET / PUT / DELETE |
| 201 | Successful POST (creation) |
| 400 | Missing or invalid input |
| 401 | Missing or invalid auth token |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

### Hasura admin client

- All server-side Hasura calls go through `hasuraQuery` / `hasuraMutation` from `src/app/graphql/hasura-server-client.ts`.
- **Never import the Hasura admin secret into client components.** `HASURA_GRAPHQL_ADMIN_SECRET` is a server-only env var.

### GraphQL query strings

- Store all queries and mutations in `src/app/graphql/{Resource}/{resource}Queries.ts`.
- Use plain string constants (not `gql` tagged) for server-side route handlers (the Hasura HTTP client expects a plain string).
- Minimise fields in queries — only request fields the consumer actually uses.

### Service layer (client → API)

Every resource consumed from the frontend needs a service class in `src/app/api/v1/services/{resource}Service.ts`:

```typescript
class ReviewV2Service {
  async toggleLike(reviewId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const response = await fetch('/api/v1/restaurant-reviews/toggle-like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, user_id: userId }),
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    const data = await response.json();
    return data.data;
  }
}
export const reviewV2Service = new ReviewV2Service();
```

Components never call `fetch('/api/v1/...')` directly — they go through the service.

---

## 5. Data access rules

- **Direct Hasura GraphQL (user JWT)** — for permissioned CRUD reads/writes that do not require secrets.
- **Server-only API route (`/api/v1/...`)** — for any operation that requires:
  - the Hasura admin secret
  - Upstash Redis (caching, rate limiting)
  - image processing (Sharp/S3)
  - composition across multiple queries
  - rate limiting or abuse protection
- **Never** call `HASURA_GRAPHQL_ADMIN_SECRET` from client code. It is only used inside `src/app/api/v1/` route handlers and `src/app/graphql/hasura-server-client.ts`.

---

## 6. Redis (Upstash) — server-only

Upstash Redis is used for two things: **caching** and **rate limiting**. Both are strictly server-side.

### Caching

Use `cacheGetOrSetJSON` from `src/lib/redis-cache.ts`:

```typescript
const { value, hit } = await cacheGetOrSetJSON(
  `reviews:all:v${version}:limit=${limit}:offset=${offset}`,
  300,           // TTL in seconds
  async () => { /* expensive Hasura query */ }
);
```

- Cache keys must include a version number from `getVersion(key)` in `src/lib/redis-versioning.ts`.
- Bump the version after successful writes: `await bumpVersion('v:reviews:all')`.
- Redis failures must degrade gracefully — `cacheGetOrSetJSON` already catches errors and falls through to the live query.
- Do not cache null/404 responses for content that can be published later — use `cacheGetOrSetJSONNonNull` instead.

### Rate limiting

Rate limiters are defined in `src/lib/redis-ratelimit.ts`:

| Limiter | Limit | Applies to |
|---------|-------|------------|
| `uploadRateLimit` | 10 / 60 s | upload/image, upload/batch, download-google-photo |
| `likeRateLimit` | 20 / 10 s | toggle-like |
| `createRateLimit` | 5 / 30 s | create-review, create-comment |
| `followRateLimit` | 10 / 10 s | follow, unfollow |
| `wishlistRateLimit` | 15 / 10 s | toggle-checkin, toggle-favorite |

When a limit is exceeded return:
```json
{ "success": false, "error": "Rate limit exceeded. Please try again later.", "retryAfter": 30 }
```
with `status: 429` and `Retry-After: <seconds>` header.

Rate limit failures must also degrade gracefully (allow through).

### Do not import Redis from client components

```typescript
// ❌ Never in a client component or hook
import { redis } from '@/lib/upstash-redis';

// ✅ Only in src/app/api/v1/**/*.ts and src/lib/*.ts
```

---

## 7. Pagination

### Cursor pagination (preferred for feeds and lists)

Use `encodeReviewCursor` / `decodeReviewCursor` from `src/lib/cursor-pagination.ts`.

- Cursors encode `{ created_at, id }` as a base64url JSON string.
- The API response must include `meta.cursor` (next page cursor) and `meta.hasMore`.
- DB indexes required: `(created_at DESC, id DESC)` on `restaurant_reviews`.

### Offset pagination (legacy / acceptable for small sets)

- Keep `offset` + `limit` support in endpoints that existing clients rely on (backward compatible).
- Do not use offset pagination for deep-scroll feeds — it becomes O(n) on large tables.

### Page size defaults

- Feeds: `limit=16` default, cap at `100`.
- Grid views: `limit=8` initial, `limit=16` load-more.
- Never load unbounded lists.

---

## 8. Component rules

### Placement

| What | Where |
|------|-------|
| Base UI primitives (Button, Input, Card, etc.) | `src/components/ui/` |
| Layout chrome (Navbar, Footer, BottomNav) | `src/components/layout/` |
| Reusable feature components | `src/components/<feature>/` |
| Page-specific components | `src/app/**/_components/` |
| TastyStudio shared components | `src/components/tastystudio/` |
| SEO components | `src/components/seo/` |

### Server vs client components

- Default to **Server Components** in `src/app/` pages.
- Add `"use client"` only when you need browser APIs, `useState`, `useEffect`, or event handlers.
- Never import server-only modules (Redis, Hasura admin client, `sharp`) into client components.

### Styling

- Use **Tailwind CSS utility classes** exclusively. No inline `style={{}}` except for dynamic values that cannot be expressed as Tailwind classes.
- Use `cn(...inputs)` from `src/lib/utils.ts` for all conditional class merging — never string concatenation.
- Use CSS variable–driven theme tokens defined in `src/app/globals.css`.
- Use `font-neusans` for all TastyStudio pages and where brand typography is required.
- Brand primary colour: `#ff7c0a`. Use this for active states, CTAs.

### TastyStudio layout rule (hard rule)

- The `/tastystudio/layout.tsx` parent layout owns the `<Navbar />` and `<TastyStudioSidebar />`.
- Child layouts (`add-review/layout.tsx`, `review-listing/layout.tsx`) **must not** include `<Navbar />` or any duplicate shell.
- The sidebar is `hidden lg:flex` (desktop only). Mobile navigation inherits from `BottomNav`.

---

## 9. Hooks and state

### Session hooks (canonical)

| Hook | Use for |
|------|---------|
| `useSession()` | App-level auth state in any component |
| `useAuth()` | Simple `isAuthenticated` check |
| `useNhostSession()` | Direct Nhost auth + profile fetching (Nhost-specific, avoid in feature components) |

### Like interactions (canonical — non-negotiable)

Always use `useReviewLike` from `src/hooks/useReviewLike.ts`. Do not implement inline like logic in components.

The hook provides:
- `isLiked`, `likesCount` — display state
- `toggleLike()` — fires optimistic update, locks while in-flight, reverts on error
- `isLoading` — brief cooldown lock (220 ms) to prevent double-tap chaos
- `onConfirm` callback — lets the parent list sync the updated state after server confirmation

**Rules:**
- Never call `fetch('/api/v1/restaurant-reviews/toggle-like')` directly from a component.
- Never refetch the entire feed after a like toggle — patch only the affected item.
- The hook handles both UUID (new API) and numeric (legacy) review IDs via `UUID_REGEX`.

### Navigation (canonical)

Always use constants from `src/constants/pages.ts` for internal routes. Never hardcode path strings in components.

```typescript
// ✅
import { TASTYSTUDIO_ADD_REVIEW } from '@/constants/pages';
router.push(TASTYSTUDIO_ADD_REVIEW);

// ❌
router.push('/tastystudio/add-review');
```

---

## 10. Toast notifications

Use `customToast` from `src/utils/toast.ts`. Do not call `react-hot-toast` directly except in server-agnostic utility code.

```typescript
import customToast from '@/utils/toast';

customToast.success('Saved!');
customToast.error('Something went wrong');
customToast.loading('Uploading...');
customToast.promise(somePromise, { loading: '...', success: '...', error: '...' });
```

**Rules:**
- **No success toasts for micro-interactions** (likes, bookmarks, toggles). These must be silent or optimistic-only.
- Reserve success toasts for user-initiated operations with meaningful outcomes (review published, profile saved, etc.).
- Reserve error toasts for failures the user needs to act on.
- **One toast at a time** for long-running operations (uploads). Use `UploadContext` and the progress bar — not stacked toasts.

---

## 11. Upload and image handling

- Uploads go through the server-only backend (`/api/v1/upload/image`, `/api/v1/upload/batch`) — never directly from the browser to S3.
- Image optimization (AVIF → WebP fallback) happens server-side via Sharp. Client sends raw file; server returns the S3 URL.
- Use `UploadContext` (`src/contexts/UploadContext.tsx`) for global upload progress state.
- The upload UX must be a **single fixed progress bar** (not multiple toast notifications) while files are uploading.

---

## 12. TypeScript patterns

### Interfaces and types

- Define domain interfaces in `src/interfaces/` (restaurant, review, user).
- Define GraphQL response types in `src/types/graphql.ts` or co-located with the query.
- Use `interface` for objects, `type` for unions and utility types.

### Utility functions (canonical, in `src/lib/utils.ts`)

| Function | Purpose |
|----------|---------|
| `cn(...inputs)` | Conditional Tailwind class merging |
| `formatLikeCount(n)` | 1234 → `1.2k`, 1234567 → `1.2M` |
| `generateProfileUrl(id, username?)` | Canonical profile URL builder |
| `parseProfileUrl(param)` | Profile URL parser (handles username and encoded IDs) |
| `validateUsername(username)` | Username policy enforcement |
| `generateDefaultUsername()` | Secure random `user_xxxxxxxx` generation |
| `PAGE(basePath, subPaths, params)` | Typed URL builder |
| `formatDate(str)` / `formatDateT(str)` | Date string → `DD/MM/YYYY` |

Do not reinvent these in components — import from `@/lib/utils`.

### No magic `any`

If a Hasura response type is unknown, define an explicit interface. Using `any` to silence a TS error is a red flag.

---

## 13. Performance rules

### Feed rendering

- **Cursor pagination** is the default for infinite-scroll feeds. Offset pagination is acceptable only for shallow lists where deep scrolling is not expected.
- **Do not add list virtualization** by default. The SNS pattern (small page sizes + cursor pagination + infinite scroll) keeps the DOM lean without virtualization complexity.
  - Add virtualization only when you have a proven performance issue with a large in-memory list.
- Use `IntersectionObserver` for triggering load-more (already used in `Reviews.tsx`).

### Interaction latency

- Likes: optimistic update is mandatory (see `useReviewLike` rules above).
- Comments: show a temporary "pending" entry immediately on submit; replace with server response on success.
- Do not block the UI waiting for a write to confirm before updating visual state.

### Batch queries, not N+1

- Never loop over a result set and fire a query per item.
- Use batch GraphQL queries (e.g., `GET_RESTAURANTS_BY_UUIDS`) to fetch related data in one call.
- Feed APIs should return denormalized author + restaurant data in a single response.

### Defer non-critical work

- Follow-status checks, image preloads, and heavy animations should not compete with the critical first-paint path.
- Load-more and background sync can run after the initial content is interactive.

---

## 14. SEO rules

- Use `generateMetadata()` from `src/lib/seo.ts` for all page metadata.
- Use `StructuredData` from `src/components/seo/StructuredData.tsx` for JSON-LD.
- `NEXT_PUBLIC_SITE_URL` must be set correctly in production — it drives sitemap, robots, and OG canonical URLs.
- `/ads.txt` and the AdSense meta tag must use the same `NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID` value.

---

## 15. Address formatting (restaurants)

Always use this priority order — do not invent alternatives:

1. `googleMapUrl.streetAddress` (full string from Google Places)
2. Composed from `googleMapUrl` components (`streetNumber streetName, city, stateShort, countryShort, postCode`)
3. `listingStreet` (plain text fallback)
4. `"No address available"`

The canonical utility: `getBestAddress(googleMapUrl, listingStreet)` in `src/utils/addressUtils.ts`.

---

## 16. What to treat as outdated

Do not follow guidance from these legacy concepts unless confirmed in current running code:

- Any reference to a WordPress backend, WooCommerce, or PHP functions (the current data layer is Hasura/Postgres).
- Firebase-first auth instructions (Firebase is a migration fallback only, behind `NEXT_PUBLIC_USE_NHOST=false`).
- Client-side admin secret usage of any kind.
- Nhost Functions-based backend patterns (the current backend is the standalone `tastyplates-backend`).
- `/v0/` API routes (current API prefix is `/api/v1/`).
- One-off migration scripts or refactor instructions that are already done.

---

## 17. Making changes — workflow checklist

When adding or modifying a feature:

1. **Route handler** — add/modify in `src/app/api/v1/{resource}/{action}/route.ts`.
2. **GraphQL query** — add to `src/app/graphql/{Resource}/{resource}Queries.ts`.
3. **Service layer** — expose via `src/app/api/v1/services/{resource}Service.ts`.
4. **Cache invalidation** — if the write changes cached data, call `bumpVersion(key)`.
5. **Hook/state** — if the interaction affects shared state (likes, follow, upload), update or use the canonical hook.
6. **Constants** — add any new routes to `src/constants/pages.ts`.
7. **TypeScript** — run `yarn type-check` and fix all new errors before committing.
