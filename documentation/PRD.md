## Purpose

`tastyplates-v2-1` is the **Tastyplates frontend** (web + optional native wrapper build) built with Next.js.

It provides the user experience for:

- Discovering restaurants (search, filters, sorting, location-aware browsing)
- Creating and consuming reviews (feed, viewer, comments/replies, likes)
- User profiles and social graph (follow/unfollow, suggested users)
- Creator workflow via **TastyStudio** (`/tastystudio/*`)
- PWA + optional Capacitor-native builds

The frontend integrates with:

- **Nhost Auth** (primary auth/session)
- **Hasura GraphQL** (data layer)
- **tastyplates-backend** (server-only APIs such as uploads, rate limiting, caching, composition endpoints)
- **Upstash Redis** (used indirectly through backend and/or legacy Next API routes)
- **AWS S3** (image hosting, via backend upload endpoints)

---

## In scope

### Supported platforms

- **Web**: standard Next.js server output
- **PWA**: installable, offline-capable where configured
- **Native wrapper**: Capacitor build via `build:native` (static export)

### Core product flows

#### Authentication (current)

- Primary provider: **Nhost** (email/password + Google OAuth)
- Session and JWT handled by `@nhost/nextjs`
- A universal session interface exists during migration (`src/hooks/useSession.ts`)

#### Restaurant discovery

- Browse `/restaurants` with filters and sorting
- Location-aware browsing (city/region selection)
- Search algorithm behaviors documented in `documentation/SEARCH_ALGORITHM.md`

#### Reviews

- Create/edit/delete reviews
- Comment/replies
- Like toggling
- Performance work focuses on feed + viewer virtualization and cursor pagination

#### Uploads

- Image optimization (AVIF/WebP) and upload progress UX
- Uploads are routed through API endpoints (prefer backend server-only endpoints where available)

#### TastyStudio

- Creator hub: dashboard, add-review, review-listing
- Dedicated layout and design rules

#### Monetization (optional / production-only)

- The app supports **Google AdSense** in a consent-gated way (cookie accept → load AdSense script; decline → do not load).
- Ad-related wiring is configured via `NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID` and an `/ads.txt` route.

---

## Out of scope (by design)

- Owning the database schema and Hasura metadata/migrations (owned by `tastyplates-nhost`)
- Storing or exposing admin secrets in the client
- Backend-only logic that requires secrets or privileged writes

---

## Non-functional requirements

- **Security**
  - Never ship admin secrets to the browser.
  - Use `Authorization: Bearer <token>` where required; tokens originate from the active auth session.

- **Performance**
  - Prefer cursor pagination for deep scrolling feeds.
  - Maintain smooth feed browsing (virtualization only when proven necessary).
  - Keep image upload UX responsive with progress feedback.

- **Reliability**
  - Degrade gracefully if caches/rate limits are unavailable (avoid hard user-facing failures when possible).

- **Consistency**
  - UI component patterns, naming, and layout rules follow the codebase conventions (see `AI_Rules.md`).

---

## Success metrics (practical)

- Auth works end-to-end (sign in / sign up / verification / reset password) with Nhost.
- Restaurant browsing feels stable across infinite scroll and sort changes.
- Feed and review viewer maintain smooth interaction on mobile and desktop.
- Uploads produce optimized images and clear progress UI.

