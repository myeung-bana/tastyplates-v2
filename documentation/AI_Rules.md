## Scope of these rules

This file defines the **only** conventions this frontend codebase should follow going forward.

If older docs in `documentation/` conflict with this file, this file wins.

---

## Project invariants

- **Next.js App Router** is the primary routing model (`src/app/`).
- Use **TypeScript** everywhere; keep `strict` mode meaningful (do not add new `any` to avoid errors).
- **No secrets in the browser** (no Hasura admin secret, no backend admin secret).

---

## Auth rules (migration-safe)

- Use `src/hooks/useSession.ts` for app-level session access.
- **Default auth provider is Nhost**.
  - Only use Firebase paths if explicitly running in migration mode (`NEXT_PUBLIC_USE_NHOST=false`).
- All auth-derived identity must come from the active session/JWT, not user-supplied ids.

---

## Data access rules

- Prefer **direct Hasura GraphQL** (user JWT) for permissioned CRUD reads/writes.
- Use **server-only endpoints** for:
  - uploads and image processing
  - rate limiting / anti-abuse
  - cache versioning/invalidation
  - composition endpoints that join multiple entities
- **Redis rule**: Upstash Redis is **server-only**. Do not import Redis clients/helpers into client components.

---

## UI + component rules

- **Component placement**
  - `src/components/ui/` for reusable UI primitives (Radix + shadcn-style patterns).
  - `src/components/<feature>/` for reusable feature components.
  - `src/app/**/_components/` for page/route-group specific components (colocated with the page).
  - Keep “shared layout” pieces in `src/components/layout/` (Navbar/Footer/BottomNav/etc).
- **Client vs server components**
  - Default to Server Components in `src/app/` unless you need client-only hooks/state.
  - Client components must include `"use client"` at the top.
- **Styling**
  - Use Tailwind tokens and project theme variables (from `globals.css` / Tailwind config).
  - Prefer the existing `cn()` utility for conditional className merging.
  - Use `font-neusans` where required by design rules.

### TastyStudio rules

- Follow `documentation/tastyplatestudio-rules.md` for `/tastystudio/*` pages:
  - parent layout owns the Navbar + sidebar layout
  - child layouts must not duplicate the Navbar

---

## Performance rules

- Prefer cursor pagination for deep scroll lists.
- **Do not add list virtualization by default.** If we’re paginating and only rendering small pages (SNS pattern), virtualization adds complexity with little benefit.
- Avoid UI spam (multiple toasts) for long-running operations such as uploads; use a single progress indicator.
- **Interaction micro-UX**
  - Likes must be **optimistic** and consistent across all surfaces (feed, detail, modal, profile).
  - Avoid full refetch after a like; patch only the affected review object.
  - Prevent rapid double-taps from generating conflicting like/unlike sequences (lock while pending or last-write-wins).
- **Uploads UX**
  - AVIF/WebP optimization happens server-side; the client should present a single progress surface (progress bar) and avoid multiple progress toasts.
- **Toast system**
  - Prefer the centralized toast utility and its standard styling.
  - Avoid success toasts for micro-interactions (e.g. like toggles); reserve toasts for errors and important confirmations.

---

## Restaurant search rules (correctness)

- Avoid client-side “sort over partial data” for paginated lists.
- Sorting and filtering rules must be stable across pagination:
  - the server query (Hasura/backend) should own ordering for a given mode
  - the client should treat the list as already ordered and only append pages
- Treat older algorithm docs that reference legacy backends (e.g. WordPress-era behavior) as historical unless confirmed in current code.

---

## Address formatting rule (restaurant cards + details)

When showing an address, use a single consistent priority:

1. `googleMapUrl.streetAddress` (best)
2. composed from `googleMapUrl` components (if present)
3. `listingStreet`
4. fallback text (e.g. “No address available”)

---

## What to treat as outdated

These topics appear in older docs and should not be treated as canonical unless confirmed in current code:

- One-off migration-only instructions (e.g. “move everything to Nhost functions”)
- WordPress-specific backend assumptions (where the current system uses Hasura + `tastyplates-backend`)
- Any guidance that requires client-side admin secrets

