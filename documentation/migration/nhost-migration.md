# Nhost Migration — Authentication & User Profile Architecture

This document describes how the Tastyplates app authenticates users via Nhost and how the `auth.users` table is linked to the `public.user_profiles` table. It serves as the authoritative reference for the current post-migration state.

---

## Overview

Authentication is handled entirely by **Nhost Auth**. Nhost manages its own internal `auth.users` table (inside the `auth` schema) which stores credentials, OAuth provider details, email verification status, and the user's `avatarUrl`. Application-specific profile data (username, bio, palates, onboarding state, etc.) lives in a separate **`public.user_profiles`** table that is linked to `auth.users` by a foreign key.

The Hasura GraphQL Engine sits on top of Postgres and exposes both tables. All direct Hasura access from the server uses the **Hasura admin secret** — this secret is never sent to the browser.

---

## Database Schema Relationship

```
auth.users                          public.user_profiles
──────────────────────────          ──────────────────────────────────────
id          uuid  (PK)  ─────────► user_id     bpchar  (FK → auth.users.id)
email       text                    uuid        uuid    (PK — separate column)
avatarUrl   text                    username    text
metadata    jsonb                   about_me    text
...                                 birthdate   date
                                    gender      text
                                    pronoun     text
                                    palates     jsonb
                                    onboarding_complete  boolean
                                    created_at  timestamptz
                                    updated_at  timestamptz
```

**Key points:**
- `auth.users.id` is a UUID and is the primary key managed by Nhost.
- `user_profiles.user_id` is typed as `bpchar` in Postgres (and exposed as `bpchar` in Hasura's GraphQL schema), but it stores the same UUID string.
- `user_profiles.uuid` is a **separate** non-nullable UUID column used as the table's own primary key — it is set to `auth.users.id` at creation time.
- A Hasura relationship (`AuthorProfile` / `user`) connects reviews and user_profiles back to `auth.users` for nested queries.
- Foreign key constraints are in place: `user_profiles.user_id → auth.users.id (ON DELETE CASCADE)`.

---

## Authentication Service — `nhostAuthService`

**File:** `src/services/auth/nhostAuthService.ts`

A singleton class that wraps all Nhost auth operations. It is the single point of entry for auth across the app.

### Key Methods

| Method | Description |
|---|---|
| `registerWithEmail(email, password, options)` | Signs the user up via `nhost.auth.signUp()`, then immediately creates a `user_profiles` row |
| `signInWithEmail(email, password)` | Signs the user in via `nhost.auth.signIn()`, checks for an existing profile, and creates one if missing |
| `signInWithGoogle(redirectTo?)` | Triggers Nhost's Google OAuth redirect flow. Returns `{ error? }` — never throws |
| `signOut()` | Calls `nhost.auth.signOut()`. Errors are swallowed; callers always proceed with local cleanup |
| `getUserProfile(userId)` | Queries `user_profiles` filtered by `user_id`. Returns a discriminated union: `'ok' \| 'not_found' \| 'error'` |
| `createUserProfile(userData)` | Inserts a new row into `user_profiles` with `user_id` set to the Nhost user UUID |
| `resendVerificationEmail(email)` | Calls `nhost.auth.sendVerificationEmail()` |

### Email Sign-Up Flow

```
Register page
  └─► nhostAuthService.registerWithEmail(email, password, { username })
        ├─► nhost.auth.signUp({ email, password })
        │     └─► Nhost creates auth.users row, returns session.user.id
        └─► createUserProfile({ user_id: session.user.id, username, ... })
              └─► Hasura mutation: insert_user_profiles_one
                    (user_profiles.user_id = auth.users.id)
```

On success the register page stores onboarding data in `localStorage` and redirects to `/onboarding`.

### Email Sign-In Flow

```
Login page
  └─► nhostAuthService.signInWithEmail(email, password)
        ├─► nhost.auth.signIn({ email, password })
        │     └─► Nhost validates credentials, returns session + user
        ├─► getUserProfile(session.user.id)
        │     ├─► Found → proceed
        │     └─► Not found → createUserProfile() (safety net)
        └─► return { success: true, session, user }
```

Any credential failure returns `{ success: false, error: 'Invalid username or password. Please try again.' }` without throwing or logging the raw error.

### Google OAuth Flow

```
Login / Register page
  └─► nhostAuthService.signInWithGoogle(redirectTo)
        └─► nhost.auth.signIn({ provider: 'google', options: { redirectTo } })
              └─► Browser is redirected to Google → then back to redirectTo
                    Session is established automatically by Nhost on return
```

Google OAuth does **not** trigger `createUserProfile()` directly. A Hasura **Event Trigger** on `auth.users INSERT` should handle `user_profiles` creation for new OAuth users (see Pending Tasks below).

---

## Session Hook — `useNhostSession`

**File:** `src/hooks/useNhostSession.ts`

The primary React hook used to access both the Nhost auth state and the custom user profile in any component.

### Returns

| Field | Type | Source |
|---|---|---|
| `user` | `UserProfile \| null` | `public.user_profiles` (via server API) |
| `nhostUser` | `NhostUser \| null` | `auth.users` (via `useUserData()`) |
| `loading` | `boolean` | Combined auth + profile loading state |
| `authReady` | `boolean` | `true` as soon as Nhost confirms auth status (before profile fetch completes) |
| `error` | `string \| null` | Any profile fetch error |

### How It Works

```
useNhostSession
  ├─► useAuthenticationStatus()   →  isAuthenticated, isLoading  (from @nhost/nextjs)
  ├─► useUserData()               →  nhostUser (auth.users object)
  └─► On isAuthenticated change:
        fetch GET /api/v1/restaurant-users/get-restaurant-user-by-id?id=<uuid>
          └─► Server route calls hasuraQuery(GET_USER_PROFILE_BY_ID)
                (uses HASURA_GRAPHQL_ADMIN_SECRET — never exposed to browser)
                └─► Returns user_profiles JOIN auth.users → UserProfile
```

The profile is fetched via the server-side API route (not directly from the browser) to keep the Hasura admin secret secure.

---

## Universal Session Hook — `useSession`

**File:** `src/hooks/useSession.ts`

A compatibility bridge that switches between Nhost and the legacy Firebase session based on the `NEXT_PUBLIC_USE_NHOST` environment variable (defaults to `true`).

```typescript
// When NEXT_PUBLIC_USE_NHOST = true (current state):
const { user, nhostUser, loading } = useNhostSession();
return { user, authUser: nhostUser, loading };
```

Most components should use `useSession` (not `useNhostSession` directly) for forward compatibility.

---

## Server-Side Hasura Client

**File:** `src/app/graphql/hasura-server-client.ts`

All server-side API routes use this thin wrapper to query Hasura with the admin secret:

```typescript
hasuraQuery(query, variables)   // for queries
hasuraMutation(query, variables) // for mutations (same implementation)
```

Both functions POST to `NEXT_PUBLIC_HASURA_GRAPHQL_API_URL` with the `x-hasura-admin-secret` header. This secret is only available in the server runtime and is never sent to the client.

---

## API Routes for User Profiles

### `GET /api/v1/restaurant-users/get-restaurant-user-by-id`

Fetches a full user profile by Nhost user UUID. Used by `useNhostSession` and anywhere a profile lookup is needed.

**Flow:**
1. Validates `id` query param is a valid UUID
2. Calls `hasuraQuery(GET_USER_PROFILE_BY_ID, { user_id: id })`
3. Merges `user_profiles` + nested `auth.users` data into a unified `RestaurantUser` shape
4. Returns `{ user: RestaurantUser }`

### `PUT /api/v1/restaurant-users/update-restaurant-user`

Updates a user's profile. Handles both avatar and profile field changes.

**Flow:**
1. If `profile_image` is in the payload → `hasuraMutation(UPDATE_USER_AVATAR)` updates `auth.users.avatarUrl`
2. All other fields (`username`, `about_me`, `gender`, `pronoun`, `palates`, `onboarding_complete`) → `hasuraMutation(UPDATE_USER_PROFILE)` updates `user_profiles`
3. Re-fetches and returns the updated profile

**Note:** Avatar URL lives in `auth.users.avatarUrl` (managed via the `updateUser` Hasura mutation), while all other profile data lives in `public.user_profiles`.

---

## GraphQL Queries & Mutations

**File:** `src/app/graphql/UserProfiles/userProfilesQueries.ts`

| Name | Operation | Description |
|---|---|---|
| `GET_USER_PROFILE_BY_ID` | Query | Fetch profile by `user_id` (`bpchar!`), includes nested `user { avatarUrl, email }` |
| `GET_USER_PROFILE_BY_USERNAME` | Query | Same shape filtered by `username` |
| `GET_ALL_USER_PROFILES` | Query | Paginated list |
| `CREATE_USER_PROFILE` | Mutation | `insert_user_profiles_one` with upsert on primary key |
| `UPDATE_USER_PROFILE` | Mutation | `update_user_profiles` where `user_id = $user_id` |
| `UPDATE_USER_AVATAR` | Mutation | `updateUser` — updates `auth.users.avatarUrl` |
| `DELETE_USER_PROFILE` | Mutation | `delete_user_profiles` where `user_id = $user_id` |
| `CHECK_USERNAME_EXISTS` | Query | Returns boolean for username uniqueness check |

**Important:** `user_id` variables must be typed as `bpchar!` in GraphQL (not `uuid!` or `String!`) because of how Hasura exposes the `bpchar` column type.

---

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Client + Server | Nhost project subdomain |
| `NEXT_PUBLIC_NHOST_REGION` | Client + Server | Nhost project region |
| `NEXT_PUBLIC_HASURA_GRAPHQL_API_URL` | Client + Server | Hasura GraphQL endpoint URL |
| `HASURA_GRAPHQL_ADMIN_SECRET` | **Server only** | Hasura admin secret — never expose to client |
| `NEXT_PUBLIC_USE_NHOST` | Client + Server | Feature flag — set to `'true'` to use Nhost (default) |

---

## Pending Tasks

The following items are outstanding from the migration and must be completed:

1. **Hasura Event Trigger for Google OAuth users** — New `auth.users` rows created via Google OAuth do not automatically get a `user_profiles` row. A Hasura Event Trigger on `INSERT` to `auth.users` should call a webhook at `/api/v1/webhooks/on-user-created` to create the profile row with a generated username.

2. **Baseline browser mapping** — `yarn build` reports warnings about `browserslist` targets being out of date. Run `npx update-browserslist-db@latest` to fix.

3. **Sass `@import` deprecation** — Sass files use the deprecated `@import` syntax. Migrate to `@use` / `@forward` to suppress warnings.

4. **`followers_count` / `following_count`** — These are currently hardcoded to `0` in the API route response. A follow/follower system needs to be implemented or the fields removed from the response shape.
