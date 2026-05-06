## System overview

`tastyplates-v2-1` is a Next.js (App Router) frontend that runs as:

- **Web** (standard Next build/runtime)
- **PWA** (via `next-pwa`)
- **Optional native wrapper** (Capacitor, using static export for native builds)

High level:

```text
Browser / PWA / Capacitor WebView
  └─ Next.js frontend (tastyplates-v2-1)
       ├─ Nhost Auth (JWT sessions)
       ├─ Hasura GraphQL (primary CRUD)
       ├─ tastyplates-backend (/api/v1 server-only)
       └─ CDN/S3 (images)
```

---

## Tech stack (as implemented)

- **Framework**: Next.js (`next`), App Router + API routes
- **Language**: TypeScript (strict)
- **UI**: React 19, Tailwind CSS, Radix UI primitives, shadcn-style component patterns
- **Auth**: `@nhost/nextjs` + `@nhost/react` (primary). Firebase remains in repo for migration fallback.
- **GraphQL**: Apollo client/server utilities present, plus Nhost GraphQL client usage
- **PWA**: `next-pwa`
- **Native wrapper**: Capacitor (`@capacitor/*`)
- **Perf tooling**: `@tanstack/react-virtual`, gesture libs, animation libs

---

## Repository layout (key paths)

From the coding guidelines:

- `src/app/` — Next.js App Router pages + route groups
- `src/app/api/` — Next.js API routes (legacy BFF layer + internal utilities)
- `src/components/` — reusable UI/feature components
- `src/components/ui/` — base UI primitives
- `src/hooks/` — session + app hooks (`useSession`, `useNhostSession`, etc.)
- `src/services/` — auth and service wrappers
- `src/lib/` — shared utilities (`nhost.ts`, server auth helpers, etc.)
- `documentation/` — design notes, performance, migration notes, how-tos

---

## Authentication architecture (current)

### Client auth

- Nhost client is created **only in the browser** to avoid build/SSR failures:
  - `src/lib/nhost.ts`

### Session model

- Prefer `src/hooks/useSession.ts` as the unified interface:
  - default uses **Nhost** unless `NEXT_PUBLIC_USE_NHOST=false`
  - falls back to Firebase session during migration

### Profile hydration

- After authentication, the app fetches the app-level profile row (e.g. `user_profiles` / `restaurant_users`) via an API route and stores it in session hooks.

### Auth flow wiring (app shell)

At runtime the app wires auth and redirects at the “layout/provider” layer so pages don’t need to hand-roll gating logic:

- Provider wrapper: `src/components/auth/NhostProviderWrapper.tsx`
- Session/profile hydration: `src/hooks/useNhostSession.ts`
- OAuth callback handling: `src/components/auth/OAuthCallbackHandler.tsx`
- Redirect guards:
  - `src/components/auth/VerificationRedirect.tsx` → routes unverified users to `/user-verification`
  - `src/components/auth/OnboardingRedirect.tsx` → routes users with incomplete onboarding to `/onboarding`

### Password reset model (Nhost)

- Request reset email (forgot password): Nhost sends a link back to `/<origin>/reset-password?...`
- Reset page: `/reset-password` loads; Nhost exchanges the token from URL into a session; UI calls `changePassword`.
- If token is invalid/expired, the page should show a clear “link invalid/expired” state.

---

## Data access patterns

### Hasura GraphQL

- Primary CRUD is designed to be handled by Hasura with user JWT permissions.

### Server-only APIs

Certain actions should run through server-only endpoints (backend):

- uploads + image optimization
- rate limiting / abuse control
- composition endpoints (feeds/search that require multiple queries)
- cache invalidation/versioning

---

## Performance architecture (frontend)

Key strategies present in docs:

- **Cursor pagination** for deep scroll performance (preferred)
- **Windowed rendering** for heavy review viewers (render only current ± adjacent)
- Avoid toast spam for uploads; show a single progress UI

---

## Build targets

### Web

- `yarn dev` / `yarn build` / `yarn start`

### Native wrapper build

- `yarn build:native`
  - sets `NEXT_BUILD_TARGET=native`
  - Next config switches to `output: "export"` with `trailingSlash: true`
  - syncs Capacitor assets (`npx cap sync`)

---

## Configuration

### Next config

- `next.config.ts`
  - PWA wrapper
  - image `remotePatterns`
  - native build export settings
  - API rewrite for `'/api/graphql-proxy'` (legacy)

### Tailwind

- `tailwind.config.ts`
  - CSS variable driven theme tokens
  - `fontFamily` includes `neusans`

### TypeScript

- `tsconfig.json` strict with `@/*` path alias

---

## AdSense + consent architecture (production)

This repo supports AdSense in a way that is compatible with consent-gated script loading.

- **Publisher ID env var**: `NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID` (e.g. `ca-pub-...`)
- **Meta tag**: `src/lib/seo.ts` emits `google-adsense-account` when the publisher ID is set.
- **`/ads.txt` route**: `src/app/ads.txt/route.ts` returns the standard `google.com, pub-…, DIRECT, …` line based on the same env var (and an optional certification authority id).
- **Consent-gated script load**: `src/components/layout/CookieConsentAndAdSense.tsx`
  - “Accept” → loads `adsbygoogle.js`
  - “Decline” → script never loads
  - Stores choice in `localStorage` (`tastyplates_cookie_consent`)
- **Legal pages + discoverability**
  - Privacy/cookie/terms pages exist and should match the actual behavior.
  - Mobile legal links are exposed even when the desktop footer is hidden.

---

## Upload architecture (server-only)

Uploads are designed to be handled by server-side endpoints (not directly from the browser to S3), so the app can:

- validate file size/type and rate limit abuse
- optimize images (AVIF-first with WebP fallback)
- keep credentials and processing server-only

Key concepts (as implemented historically in this repo):

- Image optimization uses Sharp with env-configured settings such as `IMAGE_MAX_WIDTH`, `IMAGE_MAX_HEIGHT`, `IMAGE_AVIF_QUALITY`, `IMAGE_WEBP_QUALITY`.
- Upload UX uses a single global progress surface (progress bar) instead of toast spam.

---

## Caching + rate limiting (Upstash Redis, server-only)

Some server endpoints (legacy Next route handlers and/or the standalone backend) use Upstash Redis for:

- shared caching (short TTL + versioned keys)
- rate limiting for sensitive actions (likes, create, uploads, follow)
- cache invalidation via version bumps after successful writes

Important constraints:

- Redis must be imported **only** from server code (never from client components).
- Redis failures must degrade gracefully (fall back to direct reads / allow-through rate limit).

---

## SEO architecture

SEO is implemented with the Next.js metadata APIs plus shared utilities:

- Metadata and structured data helpers: `src/lib/seo.ts`
- JSON-LD injection: `src/components/seo/StructuredData.tsx`
- Dynamic sitemap: `src/app/sitemap.ts`
- Robots rules: `src/app/robots.ts`

Configuration is driven by public env vars (e.g. `NEXT_PUBLIC_SITE_URL`) and optional search tooling integrations (Bing verification / Clarity) when set.

---

## PWA + “native feel” interactions (haptics)

The app supports haptics as progressive enhancement on mobile:

- Hook: `src/hooks/useHaptic.ts`
- Convention: shared `Button` component can fire haptics by variant; callers can override or disable per interaction.

