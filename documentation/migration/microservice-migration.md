# Microservice Migration Plan

## Goal
Move `src/app/api/v1` from in-app Next.js routes to server-side microservices without breaking the current Nhost login/session flow or user experience.

## Current Build Snapshot
- **Client auth/session**: Nhost SDK is used in `src/services/auth/nhostAuthService.ts` and `src/hooks/useNhostSession.ts`.
- **Server auth verification**: API routes validate bearer tokens with `src/lib/nhost-server-auth.ts`.
- **Server data access**: Some routes use Hasura via `src/app/graphql/hasura-server-client.ts`.
- **Risk area today**: profile reads happen directly from client GraphQL in `useNhostSession`, which bypasses the future service boundary.

## Target Architecture
- **Auth authority**: Nhost remains source of truth for sign-in/sign-up/session refresh.
- **API authority**: Microservices own business endpoints currently under `/api/v1/*`.
- **Token model**: Client sends `Authorization: Bearer <nhost access token>` to microservices.
- **Data access**: Microservices call Hasura/database on behalf of users, enforce domain rules, and return sanitized responses.

## Guiding Principles
- Keep login and token lifecycle unchanged at first.
- Migrate endpoints by domain, not all at once.
- Maintain response shape compatibility to avoid frontend rewrites.
- Preserve idempotency and rate limiting on write operations.
- Add observability before high-risk cutovers.

## Migration Phases

### Phase 0 - Stabilize Current Nhost Baseline (Now)
1. Ensure `public.user_profiles` is tracked in Hasura and role permissions are correct.
2. Keep false profile creation guardrails in auth/profile flow.
3. Confirm env values point to the intended Nhost/Hasura project.

**Exit criteria**
- Login succeeds for existing users.
- No profile auto-create attempts triggered by GraphQL schema errors.

### Phase 1 - Define Service Contract Layer
1. Introduce versioned external base URL (example: `NEXT_PUBLIC_API_V1_BASE_URL`).
2. Keep current client repositories/services, but route through one configurable base URL.
3. Freeze API payload contracts for:
   - `restaurant-users`
   - `restaurant-reviews`
   - `restaurants-v2`
   - upload endpoints

**Exit criteria**
- Frontend can switch between local Next API and external service by env toggle only.

### Phase 2 - Extract Auth-Guarded User/Follow Services First
Migrate lower-blast-radius auth routes first:
- `restaurant-users/follow`
- `restaurant-users/unfollow`
- `restaurant-users/check-follow-status`
- `restaurant-users/suggested`

Implementation notes:
1. Reuse the current token verification contract from `verifyNhostToken`.
2. Keep rate-limit behavior parity with current endpoints.
3. Preserve HTTP status codes and error messages where possible.

**Exit criteria**
- Follow/unfollow flows work end-to-end against microservice.
- No UI-level regression for follower/following counts.

### Phase 3 - Extract Review Workflows
Migrate review endpoints in sequence:
1. Read endpoints (`get-review-by-id`, `get-replies`, feeds).
2. Write endpoints (`create-review`, `update-review`, `delete-review`, likes/comments).

Implementation notes:
1. Add idempotency keys for write endpoints if retries are possible.
2. Keep pagination cursor behavior stable.
3. Add structured logging for review mutations.

**Exit criteria**
- Review CRUD and engagement metrics match current behavior.
- Error handling parity confirmed for auth and validation failures.

### Phase 4 - Extract Profile/Onboarding and Remove Client Direct GraphQL
1. Add a server endpoint for session profile bootstrap (example: `/auth/me` or `/users/me`).
2. Update `useNhostSession` to fetch profile through service endpoint instead of direct client GraphQL.
3. Keep Nhost SDK for auth status/session, but centralize profile reads server-side.

**Exit criteria**
- Client no longer depends on direct Hasura `user_profiles` query for session bootstrap.
- Profile permissions become service-enforced instead of client-exposed.

### Phase 5 - Cutover and Decommission
1. Flip env to microservice endpoints in production.
2. Keep a rollback switch to in-app routes for one release window.
3. After stability period, retire duplicate Next `/api/v1` route handlers.

**Exit criteria**
- All target endpoints served by microservices.
- Next app API routes removed or retained only as temporary proxy/fallback.

## Authentication and Security Plan
- Keep Nhost login on client; do not expose Hasura admin secrets to browser.
- Verify bearer token in microservice on every protected request.
- Prefer service-level authorization checks even when Hasura row policies exist.
- Rotate service secrets and enforce least-privilege environment usage.

## Environment Strategy
- **Client-visible**: only public API base URL and public Nhost settings.
- **Server-only**: Hasura admin/privileged credentials and internal service keys.
- Rename server-only Hasura URL variables away from `NEXT_PUBLIC_*` where possible.

## Compatibility Strategy
- Maintain existing response schema during transition.
- Use adapter layer in repositories if microservice contract diverges.
- Migrate endpoint groups behind feature flags.

## Observability and Rollout
- Add per-endpoint metrics: latency, 4xx/5xx rates, auth failure counts.
- Add correlation IDs from client -> service -> Hasura path.
- Start with canary rollout for authenticated traffic, then ramp.

## Risks and Mitigations
- **Risk**: auth/session regressions during cutover.  
  **Mitigation**: keep Nhost client auth unchanged; migrate only resource APIs first.
- **Risk**: permission mismatches between Hasura and service checks.  
  **Mitigation**: explicit service authorization tests for each protected endpoint.
- **Risk**: contract drift breaks frontend assumptions.  
  **Mitigation**: contract tests and temporary compatibility adapters.

## Suggested Timeline (Incremental)
- Week 1: Phase 0-1
- Week 2: Phase 2
- Week 3: Phase 3
- Week 4: Phase 4-5 (staged rollout + rollback window)

## Definition of Done
- All intended `/api/v1` business endpoints run from microservice.
- Client auth remains Nhost-based with no login UX regression.
- Profile/session bootstrap uses server endpoint, not direct client Hasura query.
- Monitoring, alerts, and rollback switch documented and tested.
