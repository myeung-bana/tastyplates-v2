# Google Authentication — Full Technical Reference

This document covers every layer of the "Continue with Google" flow: the button that triggers it, the OAuth redirect chain, how Nhost processes the callback, how the session is established in the browser, and the post-auth redirects that drive the user to onboarding or the home feed.

---

## Architecture Overview

Google sign-in is implemented as a **full-page OAuth redirect** through Nhost's hosted auth service. There is no server-side `/api/auth/callback` route in this app. All callback handling is done client-side by `OAuthCallbackHandler`, a headless component mounted globally in the root layout.

```
User clicks button
      │
      ▼
nhostAuthService.signInWithGoogle()
      │  sets sessionStorage flags
      │  window.location.assign(Nhost provider URL)
      ▼
https://{subdomain}.auth.{region}.nhost.run/v1/signin/provider/google
      │
      ▼  (Nhost redirects user to Google)
accounts.google.com (consent screen)
      │
      ▼  (Google sends code to Nhost callback URL)
https://{subdomain}.auth.{region}.nhost.run/v1/signin/provider/google/callback
      │  Nhost creates/looks up auth.users row
      │  Nhost mints session tokens
      ▼
App page with ?refreshToken=<token>
      │
      ▼
NhostClient (SDK) picks up ?refreshToken, exchanges for session
      │
      ▼
OAuthCallbackHandler detects completion
      │
      ├─ email not verified  ──→  /user-verification
      ├─ onboarding incomplete ─→  /onboarding
      └─ fully onboarded ──────→  original destination (/ or /restaurants)
```

---

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | `.env` / `.env.local` | Nhost project subdomain (default: `ygmkmxorcapgpimwerpc`) |
| `NEXT_PUBLIC_NHOST_REGION` | `.env` / `.env.local` | Nhost region (default: `ap-southeast-1`) |
| `GOOGLE_REDIRECT_URL` | `.env` (not used in TS code) | Used in Google Cloud Console to whitelist Nhost's callback URL |
| `NEXT_PUBLIC_USE_NHOST` | `.env` | Must be `true` (or absent) to use Nhost path; `false` falls back to legacy Firebase |

The Nhost auth base URL is constructed at runtime:
```
https://{NEXT_PUBLIC_NHOST_SUBDOMAIN}.auth.{NEXT_PUBLIC_NHOST_REGION}.nhost.run
```

---

## Nhost Client Initialisation

**File:** `src/lib/nhost.ts`

```ts
const nhost = isClient
  ? new NhostClient({
      subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'ygmkmxorcapgpimwerpc',
      region: process.env.NEXT_PUBLIC_NHOST_REGION || 'ap-southeast-1',
    })
  : null;
```

- Only instantiated in the browser (`typeof window !== 'undefined'`). Server-side code imports `src/lib/nhost-server-auth.ts` instead, which uses the admin secret.
- The `NhostClient` manages session storage automatically (local storage via the `@nhost/nextjs` SDK). Tokens are refreshed transparently by the SDK.
- `NhostProvider` (mounted in `src/app/layout.tsx` via `NhostProviderWrapperDynamic`) makes the client available to all child components via React context.

---

## UI Entry Points

### Sign-In modal
**File:** `src/components/auth/SigninModal.tsx`

Renders `<LoginPage />` from `src/pages/Login/Login.tsx`. The Google button calls `loginWithGoogle()`:

```ts
// src/pages/Login/Login.tsx
const loginWithGoogle = async () => {
  sessionStorage.setItem('oauth_pending', 'true');
  sessionStorage.setItem('oauth_callback_url', HOME);          // '/'

  const result = await nhostAuthService.signInWithGoogle(
    window.location.origin + HOME
  );
  // On success: browser is immediately redirected — no more code runs here
};
```

### Sign-Up modal
**File:** `src/components/auth/SignupModal.tsx`

Renders `<RegisterPage />` from `src/pages/Register/Register.tsx`. The Google button calls `signUpWithGoogle()`:

```ts
// src/pages/Register/Register.tsx
const signUpWithGoogle = async () => {
  sessionStorage.setItem('oauth_pending', 'true');
  sessionStorage.setItem('oauth_callback_url', ONBOARDING_ONE);   // '/onboarding'
  sessionStorage.setItem('post_oauth_redirect', ONBOARDING_ONE);  // same intent

  const result = await nhostAuthService.signInWithGoogle(
    window.location.origin + ONBOARDING_ONE
  );
};
```

The key difference: **Sign-in** stores `'/'` as the callback URL; **Sign-up** stores `'/onboarding'`.

### `AuthModalWrapper`
**File:** `src/components/auth/AuthModalWrapper.tsx`

Provides `showSignin()` and `showSignup()` via context so any component in the app can open either modal without importing it directly.

---

## OAuth Redirect — `signInWithGoogle`

**File:** `src/services/auth/nhostAuthService.ts`

```ts
async signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
  const redirectTarget = redirectTo || window.location.origin;
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'ygmkmxorcapgpimwerpc';
  const region   = process.env.NEXT_PUBLIC_NHOST_REGION    || 'ap-southeast-1';

  const providerUrl =
    `https://${subdomain}.auth.${region}.nhost.run/v1/signin/provider/google` +
    `?redirectTo=${encodeURIComponent(redirectTarget)}`;

  window.location.assign(providerUrl);   // full-page redirect
  return {};
}
```

**Why `window.location.assign` instead of the Nhost SDK `signIn` method?**
The SDK's `nhost.auth.signIn({ provider: 'google' })` can sometimes fall back to a popup, which is blocked in many browser environments. Using the raw provider URL guarantees a full-page redirect every time, which is more reliable.

---

## The OAuth Redirect Chain in Detail

### Step 1 — App → Nhost
```
GET https://ygmkmxorcapgpimwerpc.auth.ap-southeast-1.nhost.run/v1/signin/provider/google
    ?redirectTo=https%3A%2F%2Fyourapp.com%2F
```
Nhost reads the `redirectTo` parameter and stores it. It then redirects the browser to Google's OAuth authorisation endpoint with its own `redirect_uri` pointing to the Nhost-hosted callback.

### Step 2 — Nhost → Google
```
GET https://accounts.google.com/o/oauth2/v2/auth
    ?client_id=<Nhost's Google client ID>
    &redirect_uri=https://ygmkmxorcapgpimwerpc.auth.ap-southeast-1.nhost.run/v1/signin/provider/google/callback
    &response_type=code
    &scope=openid email profile
    &state=<csrf token>
```
The user sees Google's consent screen and approves.

### Step 3 — Google → Nhost callback
```
GET https://ygmkmxorcapgpimwerpc.auth.ap-southeast-1.nhost.run/v1/signin/provider/google/callback
    ?code=<authorization code>
    &state=<csrf token>
```
Nhost exchanges the code for Google tokens, extracts the user's email and name, and creates or looks up the row in `auth.users`. Nhost then mints its own access + refresh tokens.

### Step 4 — Nhost → App
```
GET https://yourapp.com/
    ?refreshToken=<nhost refresh token>
```
The `redirectTo` URL from step 1 is used here, with the refresh token appended as a query parameter.

> **Nhost dashboard requirement:** The app's origin (`https://yourapp.com`) must be listed under **Allowed Redirect URLs** in the Nhost console for this final redirect to be permitted.

---

## Session Establishment

When the app loads with `?refreshToken=` in the URL, the `NhostClient` SDK (via `NhostProvider`) automatically:
1. Reads the `refreshToken` query parameter.
2. Exchanges it for a new access token + refresh token pair via the Nhost auth API.
3. Stores the tokens (typically in `localStorage`).
4. Emits an `SIGNED_IN` auth change event.

The `?refreshToken=` parameter is removed from the visible URL by `OAuthCallbackHandler` using:
```ts
window.history.replaceState({}, '', window.location.pathname);
```

---

## Post-Auth Callback Handling

**File:** `src/components/auth/OAuthCallbackHandler.tsx`

This headless component is mounted **globally** in `src/app/layout.tsx`. It runs on every page render but only acts when an OAuth callback is detected.

```ts
export default function OAuthCallbackHandler() {
  const { user, nhostUser, loading } = useNhostSession();
  const { isLoading: nhostIsLoading, isAuthenticated } = useAuthenticationStatus();
  // ...

  useEffect(() => {
    const pendingOAuth   = sessionStorage.getItem('oauth_pending') === 'true';
    const hasRefreshToken = !!searchParams?.get('refreshToken');
    const isOAuthCallback = hasRefreshToken || pendingOAuth;

    if (!isOAuthCallback) return;
    if (loading) return;   // wait for session + profile to fully load

    // Strip token from URL
    if (hasRefreshToken) window.history.replaceState({}, '', window.location.pathname);

    if (nhostUser) {
      if (!nhostUser.emailVerified) { router.push('/user-verification'); return; }
      if (!user?.onboarding_complete) { router.push('/onboarding'); return; }

      // Fully authenticated
      const callbackUrl = sessionStorage.getItem('oauth_callback_url') || '/restaurants';
      const resolved = callbackUrl.startsWith('/onboarding') ? '/restaurants' : callbackUrl;
      router.push(resolved);
    }
  }, [user, nhostUser, loading, ...]);
}
```

### Race condition guard
The SDK may briefly report `isLoading = false` before it has started processing the `?refreshToken=`. A `hasSeenLoadingRef` ref ensures the handler waits until the SDK has completed at least one loading cycle before deciding the user is unauthenticated.

### SessionStorage flags

| Key | Set by | Value | Cleared by |
|---|---|---|---|
| `oauth_pending` | `Login.tsx` / `Register.tsx` before redirect | `'true'` | `OAuthCallbackHandler` on completion or error |
| `oauth_callback_url` | Same | `'/'` or `'/onboarding'` | Same |
| `post_oauth_redirect` | `Register.tsx` | `'/onboarding'` | Same |

---

## User Profile Creation

Google OAuth does **not** call `createUserProfile()` directly. The flow diverges from email/password registration:

| Step | Email/Password | Google OAuth |
|---|---|---|
| `auth.users` row | Created by `nhost.auth.signUp()` | Created automatically by Nhost on first Google sign-in |
| `user_profiles` row | Created by `nhostAuthService.registerWithEmail()` | Expected to be created by a **Hasura Event Trigger** on `auth.users INSERT` |
| `onboarding_complete` default | `false` | `false` (until onboarding flow completes) |

`create-restaurant-user` API route (`src/app/api/v1/restaurant-users/create-restaurant-user/route.ts`) is partially deprecated and only used for backfill — normal Google sign-ups should not call it.

After sign-in, `useNhostSession` fetches the app profile via:
```
GET /api/v1/restaurant-users/get-restaurant-user-by-id?id={nhostUser.id}
```
If the profile row is missing (because the Hasura trigger hasn't run yet), `user` will be `null` and `useNhostSession` will report an error, which causes `OAuthCallbackHandler` to redirect to `/onboarding`.

---

## Onboarding Flow (New Google Users)

**Files:** `src/app/onboarding/page.tsx`, `src/components/onboarding/OnboardingStepOne.tsx`, `OnboardingStepTwo.tsx`

1. User lands on `/onboarding` (redirected by `OAuthCallbackHandler`).
2. **Step 1** — collect username, display name, and profile photo.
3. **Step 2** — select palate preferences (cuisine types).
4. At the end of step 2, `restaurantUserService.updateUser()` is called with `onboarding_complete: true`, persisting to `user_profiles`.
5. `sessionStorage.setItem('onboarding_just_completed', 'true')` prevents `OnboardingRedirect` from looping.
6. User is navigated to `/restaurants`.

---

## Continuous Guards (Layout-Level)

Both guards are headless components mounted in `src/app/layout.tsx` and run on every page navigation.

### `VerificationRedirect`
**File:** `src/components/auth/VerificationRedirect.tsx`

Redirects to `/user-verification` if `nhostUser` exists but `nhostUser.emailVerified === false`. Runs before `OnboardingRedirect`.

> **Note for Google users:** Google accounts are always email-verified, so `emailVerified` is `true` immediately. This guard only affects email/password registrations before the user clicks the verification link.

### `OnboardingRedirect`
**File:** `src/components/auth/OnboardingRedirect.tsx`

Redirects to `/onboarding` if `user.onboarding_complete === false`. Skips if:
- The user is already on `/onboarding`.
- `sessionStorage` has `onboarding_just_completed` (grace period after step 2 completes).
- `nhostUser.emailVerified` is false (deferred to `VerificationRedirect`).

---

## Session Persistence and Sign-Out

- **Persistence:** The Nhost SDK stores tokens in `localStorage` by default. On every page load, `NhostProvider` restores the session automatically.
- **Token refresh:** The SDK refreshes the access token silently before expiry.
- **Sign-out:** `nhostAuthService.signOut()` calls `nhost.auth.signOut()` and clears all OAuth-related `sessionStorage` keys (`oauth_pending`, `oauth_callback_url`, `post_oauth_redirect`).

---

## Layout Wiring

**File:** `src/app/layout.tsx`

```tsx
<NhostProviderWrapperDynamic>   {/* Nhost SDK context */}
  <FollowProvider>
    <LocationProvider>
      <SessionWrapper>
        <OAuthCallbackHandler />   {/* strips token, handles post-auth redirect */}
        <VerificationRedirect />   {/* unverified → /user-verification */}
        <OnboardingRedirect />     {/* incomplete onboarding → /onboarding */}
        {children}
      </SessionWrapper>
    </LocationProvider>
  </FollowProvider>
</NhostProviderWrapperDynamic>
```

There is **no `middleware.ts`** — all auth route protection is done client-side by the guards above.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `?error=` in return URL (Nhost error) | `OAuthCallbackHandler` shows toast, clears sessionStorage, strips query param |
| SDK reports unauthenticated after loading cycle | `OAuthCallbackHandler` shows toast, redirects to `/` |
| `fetchCommentReplies` or profile fetch fails | `useNhostSession` sets `error` state; component can display error message |
| Google account email already registered via email/password | Nhost merges accounts automatically (same `auth.users` row) |

---

## File Reference Summary

| File | Role |
|---|---|
| `src/lib/nhost.ts` | `NhostClient` instantiation |
| `src/lib/nhost-server-auth.ts` | Server-side admin auth client |
| `src/services/auth/nhostAuthService.ts` | `signInWithGoogle()`, `signOut()`, email/password methods |
| `src/hooks/useNhostSession.ts` | Combines Nhost auth status + `user_profiles` fetch |
| `src/pages/Login/Login.tsx` | `loginWithGoogle()` — sign-in flow entry point |
| `src/pages/Register/Register.tsx` | `signUpWithGoogle()` — register flow entry point |
| `src/components/auth/SigninModal.tsx` | Modal wrapper for Login page |
| `src/components/auth/SignupModal.tsx` | Modal wrapper for Register page |
| `src/components/auth/AuthModalWrapper.tsx` | Global modal context |
| `src/components/auth/OAuthCallbackHandler.tsx` | Post-redirect session detection and routing |
| `src/components/auth/VerificationRedirect.tsx` | Guard: unverified → `/user-verification` |
| `src/components/auth/OnboardingRedirect.tsx` | Guard: incomplete onboarding → `/onboarding` |
| `src/app/onboarding/page.tsx` | Onboarding steps 1 & 2 |
| `src/app/api/v1/restaurant-users/get-restaurant-user-by-id/route.ts` | Profile fetch after sign-in |
| `src/app/api/v1/restaurant-users/create-restaurant-user/route.ts` | (Deprecated) profile creation for backfill |
