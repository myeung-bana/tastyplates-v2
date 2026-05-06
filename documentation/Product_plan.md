## Versioning model

This file is the **version-controlled roadmap** for the Tastyplates frontend.

- **App version**: `tastyplates-v2-1/package.json` `version`
- **API contract**: treat backend endpoints as versioned (prefer `/api/v1/...` on the backend)

---

## Current state (today)

### What is running

- Next.js App Router frontend with:
  - restaurant discovery
  - reviews + interactions
  - user profiles + following graph
  - TastyStudio creator hub
- PWA support via `next-pwa`
- Optional Capacitor build via `build:native`

### Authentication

- Nhost auth is implemented and the default path.
- Firebase remains for fallback during migration, behind `NEXT_PUBLIC_USE_NHOST`.

---

## Roadmap

### Now (stabilization)

- Make auth documentation canonical and consistent:
  - Nhost-first in docs (avoid mixed Firebase-first README guidance).
- Ensure frontend calls the unified backend where required:
  - uploads
  - composition endpoints (feed/search) when caching/rate limiting is needed
- Production readiness checks:
  - AdSense integration uses **consent-gated** script loading; verify `NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID`, `/ads.txt`, and legal pages on the production domain.

### Next (performance)

Based on `documentation/Performance.md`:

- Complete/verify cursor pagination migrations are applied in the DB where required.
- Progress Phase 3:
  - move to single-query feed sources (denormalized feed table) where available
- Progress Phase 4:
  - prefetch next page for perceived instant scroll

#### What’s already been completed (keep)

From the existing performance work:

- Fixed major N+1 patterns in key API routes by using batch GraphQL queries where applicable.
- Increased cache TTLs and added cache-related response headers where those API routes are still in active use.
- Implemented (or partially implemented) the “Phase 1 + Phase 2” frontend approach:
  - cursor pagination for deep scrolling feeds

#### Clarification: “virtualization” decision

- Cursor pagination + small page sizes is the default pattern.
- Virtualization should be treated as an exception for proven cases where we must render large in-memory lists.

### Next (search correctness)

- Ensure restaurant search/sort behavior is stable across pagination (avoid client-only sorting over partial data).
- Align query params and server-side sorting strategies with the actual backend endpoint contract.

### Next (SEO + discoverability)

- Keep `NEXT_PUBLIC_SITE_URL`, sitemap, and robots rules correct for the production domain.
- Ensure structured data remains valid on key pages (homepage, restaurant detail).

### Next (curation / editorial)

- Confirm the “featured restaurants (homepage)” and “recommended restaurants (explore)” data model is present and wired:
  - homepage: one global ordered list
  - explore: city-scoped list items

### Next (uploads UX + costs)

Based on `documentation/UPLOAD_OPTIMIZATION.md`:

- Keep AVIF/WebP optimization path stable.
- Ensure progress UI covers both upload and “publish review” submit stage.

### Next (DX)

- Reduce “migration complexity” surface:
  - gradually retire Firebase-only code paths once Nhost is fully adopted
  - standardize on a single session hook usage (`useSession`)

---

## De-risking notes

- Migration docs are valuable as history, but not canonical behavior.
- When in doubt, prefer what is implemented in:
  - `src/lib/nhost.ts`
  - `src/hooks/useSession.ts`
  - `src/hooks/useNhostSession.ts`
  - `next.config.ts` for build targets

