# TastyPlates Authentication (Nhost)

Documentation of the authentication implementation for the TastyPlates platform using **Nhost** for auth, session management, and password reset.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flows](#authentication-flows)
4. [Registration Flow](#registration-flow)
5. [Password Reset Flow](#password-reset-flow)
6. [Email Verification Flow](#email-verification-flow)
7. [Technical Implementation](#technical-implementation)
8. [Routes and UI Entry Points](#routes-and-ui-entry-points)
9. [Security and Server-Side Auth](#security-and-server-side-auth)
10. [Edge Cases and Error Handling](#edge-cases-and-error-handling)

---

## Overview

TastyPlates uses **Nhost** as the authentication backend. Nhost provides:

- **Email/password** sign-up and sign-in
- **Google OAuth** sign-in (redirect-based)
- **Email verification** for new accounts
- **Password reset** via email link with token exchange
- **Session management** (JWT, refresh tokens) handled by the Nhost client

Application user data is stored in **Hasura** (e.g. `user_profiles`, `restaurant_users`). The Nhost user ID (UUID from `auth.users`) is the canonical identity used to look up profiles and to call protected APIs.

### Key highlights

- Single auth provider: **Nhost** (no Firebase/NextAuth in the auth flow)
- Session and tokens managed by **Nhost client** (`@nhost/nextjs`)
- **Email verification** required before full access; unverified users are redirected to `/user-verification`
- **Onboarding** step after verification; incomplete onboarding redirects to `/onboarding`
- **Forgot password** sends an email; user opens link and lands on `/reset-password` where they set a new password via Nhost

---

## Architecture

### Technology stack

| Layer        | Technology |
|-------------|------------|
| Auth backend| **Nhost** (Auth + Hasura in same project) |
| Client SDK  | `@nhost/nextjs` (NhostProvider, useAuthenticationStatus, useUserData) |
| Session     | `useNhostSession` hook: Nhost auth + app profile from API |
| Profile API | `/api/v1/restaurant-users/get-restaurant-user-by-id` (by Nhost user ID) |
| Server auth | `lib/nhost-server-auth.ts`: verify Nhost JWT in API routes |

### Component structure

| Component | Location | Purpose |
|-----------|----------|---------|
| Nhost client | `src/lib/nhost.ts` | Create `NhostClient` (browser only; `null` on server/build) |
| Nhost provider | `src/components/auth/NhostProviderWrapper.tsx` | Wraps app in `NhostProvider` |
| Auth service | `src/services/auth/nhostAuthService.ts` | signUp, signIn, signOut, Google OAuth, resetPassword, changePassword, resendVerificationEmail |
| Session hook | `src/hooks/useNhostSession.ts` | Auth status + Nhost user + app profile (from API); exposes `user`, `nhostUser`, `loading`, `authReady` |
| OAuth callback | `src/components/auth/OAuthCallbackHandler.tsx` | Handles post-OAuth redirect; redirects to verification, onboarding, or home |
| Verification redirect | `src/components/auth/VerificationRedirect.tsx` | Redirects unverified users to `/user-verification` |
| Onboarding redirect | `src/components/auth/OnboardingRedirect.tsx` | Redirects users with `onboarding_complete === false` to `/onboarding` |

### Provider order (root layout)

```
NhostProviderWrapperDynamic
  → UploadProvider, FollowProvider, LocationProvider
    → SessionWrapper
      → OAuthCallbackHandler, VerificationRedirect, OnboardingRedirect
        → LanguageProvider, InactivityLogout, AuthModalWrapper
          → App (children, Navbar, Footer, BottomNav)
```

---

## Authentication Flows

### Sign-in (email/password)

1. User opens **Sign In** (e.g. via modal or page) and submits email + password.
2. **Login** component calls `nhostAuthService.signInWithEmail(email, password)`.
3. Nhost validates credentials and returns a session; the Nhost client stores it (and refresh token).
4. If `session.user.emailVerified` is false, user is redirected to **`/user-verification`**.
5. Otherwise, `useNhostSession` fetches app profile from `get-restaurant-user-by-id?id={nhostUser.id}`. If profile is missing, the auth service may create a `user_profiles` row (see `nhostAuthService`).
6. If profile exists and `onboarding_complete` is false, **OnboardingRedirect** sends user to **`/onboarding`**.
7. If already verified and onboarded, user is redirected to **HOME** (or modal closes and they stay on the current page).

**Special case – already signed in:** If Nhost returns an “already-signed-in” error, the service treats it as success and uses the current session instead of failing.

### Sign-in (Google OAuth)

1. User clicks **Continue with Google** (e.g. on Login or Register).
2. App calls `nhostAuthService.signInWithGoogle(redirectTo)` which does a **full-page redirect** to Nhost’s Google provider URL:  
   `https://<subdomain>.auth.<region>.nhost.run/v1/signin/provider/google?redirectTo=<redirectTo>`.
3. User signs in with Google; Nhost creates or links the user and then redirects back to the app with auth tokens (e.g. in URL hash/query; Nhost handles this).
4. **NhostProvider** (and Nhost client) receives the callback and establishes the session.
5. **OAuthCallbackHandler** runs:
   - If `nhostUser` exists but `!nhostUser.emailVerified` → redirect to **`/user-verification`**.
   - Else if profile exists and `!user.onboarding_complete` → redirect to **`/onboarding`**.
   - Else → redirect to stored callback URL (or `/restaurants`).
6. Session and profile are then available via **useNhostSession** everywhere in the app.

---

## Registration Flow

### Email/password registration

1. User fills **Register** form (email, password, confirm password) and submits.
2. App calls `nhostAuthService.registerWithEmail(email, password, { username })`.
3. Nhost creates the user in **auth.users** and returns a session (if email verification is not enforced by Nhost config, session may be active immediately).
4. **nhostAuthService** creates a row in **user_profiles** (Hasura) with `user_id = session.user.id`, `username`, `onboarding_complete: false`.
5. If `!session.user.emailVerified`, user is redirected to **`/user-verification`**.
6. If verified, user is redirected to **`/onboarding`** (e.g. ONBOARDING_ONE). Optional: partial registration data is stored in `localStorage` for onboarding.

### Google registration (OAuth)

1. User clicks **Continue with Google** on the Register flow.
2. App sets `sessionStorage` flags (`oauth_pending`, `oauth_callback_url`, `post_oauth_redirect`) and calls `nhostAuthService.signInWithGoogle(redirectTo)` with e.g. `window.location.origin + ONBOARDING_ONE`.
3. Same OAuth redirect flow as **Sign-in (Google)** above. Nhost creates the user on first Google sign-in.
4. **OAuthCallbackHandler** checks email verification and onboarding and redirects to **`/user-verification`**, **`/onboarding`**, or home/callback.
5. Profile may be created on first API access (e.g. when `useNhostSession` or backend logic creates `user_profiles` / `restaurant_users` by Nhost user ID).

---

## Password Reset Flow

### Forgot password (request reset link)

1. User clicks **Forgot Password?** (e.g. from Sign In modal).
2. **ForgotPassword** (or ForgotPasswordModal) collects email and calls  
   `nhostAuthService.sendPasswordResetEmail(email, redirectTo)`  
   with `redirectTo = `${window.location.origin}/reset-password``.
3. Nhost sends the password-reset email with a link that will redirect to `redirectTo` with a **refresh token** (e.g. `?refreshToken=...`) so the user can set a new password in a valid session context.
4. User sees a success message; no session change yet.

### Reset password (set new password)

1. User clicks the link in the email. Nhost redirects to **`/reset-password?refreshToken=...`** (or similar, per Nhost config).
2. **Reset Password** page renders **UpdatePasswordForm** (via UpdatePasswordDynamic).
3. **NhostProvider** / Nhost client automatically exchanges the `refreshToken` in the URL for a session when the app loads.
4. **UpdatePasswordForm** uses `useAuthenticationStatus()`:
   - While Nhost is still loading (e.g. exchanging token), it shows a loading skeleton.
   - If after loading the user is **not** authenticated → show “This reset password link is invalid or has already expired.”
   - If authenticated → show the form (new password + confirm).
5. User submits; app calls `nhostAuthService.changePassword(newPassword)`.
6. On success, user is redirected to **HOME** and can sign in with the new password in the future.

**Important:** The reset link must open in the same browser/app origin so that the Nhost client can read the token from the URL and establish the session. The form then cleans the URL (e.g. `history.replaceState`) so the token is not left in the address bar.

### Change password from Settings (logged-in user)

- **Settings → Account/Security → Password** (e.g. `/settings/account-security/password`) can send a reset email to the current user’s email via the same `sendPasswordResetEmail`; user then follows the same reset-password flow above.
- Google/OAuth-only users may see a message that password is managed by their provider (no email/password reset in-app).

---

## Email Verification Flow

1. After **email/password sign-up** (and optionally for OAuth), Nhost may mark the user as unverified until they click the verification link.
2. **VerificationRedirect** (in root layout) runs on every load: if `nhostUser` exists and `!nhostUser.emailVerified`, it redirects to **`/user-verification`** (unless already on that page).
3. **User Verification** page (`/user-verification`):
   - Shows the user’s email and asks them to click the link Nhost sent.
   - **Resend:** `nhostAuthService.resendVerificationEmail(email, redirectTo)` with `redirectTo = ${origin}/user-verification?verified=1`.
   - **“I’ve verified my email”:** reloads the page so Nhost refetches the session and `emailVerified` updates.
4. When the user clicks the verification link in the email, Nhost redirects to the app (e.g. `/user-verification?verified=1`). The page then redirects to **HOME** or **`/onboarding`** (depending on `onboarding_complete`) and clears the URL.

---

## Technical Implementation

### Environment variables

```env
# Nhost (required for auth)
NEXT_PUBLIC_NHOST_SUBDOMAIN=your-subdomain
NEXT_PUBLIC_NHOST_REGION=ap-southeast-1

# Optional: override Nhost Auth URL for server-side JWT verification
NEXT_PUBLIC_NHOST_AUTH_URL=https://your-subdomain.auth.ap-southeast-1.nhost.run
```

### Nhost client (`src/lib/nhost.ts`)

- Creates `NhostClient` only when `typeof window !== 'undefined'` so the client is not instantiated during Node/build (avoids “Nhost auth client not found” in SSR/build).
- Exposes `nhost`, and optionally `auth`, `graphql`, `storage` (all `null` on server).

### Auth service (`nhostAuthService`) – main methods

| Method | Purpose |
|--------|--------|
| `registerWithEmail(email, password, options?)` | Nhost `signUp`; then creates `user_profiles` row. |
| `signInWithEmail(email, password)` | Nhost `signIn`; handles “already-signed-in”; ensures profile exists. |
| `signInWithGoogle(redirectTo?)` | Full-page redirect to Nhost Google provider URL. |
| `signOut()` | Nhost `signOut` and clear OAuth/onboarding sessionStorage. |
| `sendPasswordResetEmail(email, redirectTo)` | Nhost `resetPassword`; user receives email with link to `redirectTo`. |
| `changePassword(newPassword)` | Nhost `changePassword` (requires active session, e.g. after reset link). |
| `resendVerificationEmail(email, redirectTo?)` | Nhost `sendVerificationEmail`. |
| `getSession()`, `getUser()`, `isAuthenticated()` | Delegated to Nhost client. |

Error messages from Nhost are mapped to user-friendly strings (e.g. invalid credentials, email not verified, rate limit) in `getNhostErrorMessage`.

### Session hook (`useNhostSession`)

- Uses `useAuthenticationStatus()` and `useUserData()` from `@nhost/nextjs`.
- When authenticated, fetches app profile via **GET** `/api/v1/restaurant-users/get-restaurant-user-by-id?id={nhostUser.id}`.
- Returns: `{ user, nhostUser, loading, authReady, error }`.
  - `user`: app profile (e.g. username, onboarding_complete, language_preference).
  - `nhostUser`: Nhost auth user (id, email, emailVerified, displayName, etc.).
  - `authReady`: true when Nhost has resolved session (useful for “instant” logged-in UI).

### Profile creation

- After **sign-up** or **sign-in**, if no `user_profiles` row exists for the Nhost user ID, **nhostAuthService** creates one (e.g. `user_id`, `username` from email, `onboarding_complete: false`) via Hasura mutation in `createUserProfile`.
- Other tables (e.g. `restaurant_users`) may be created or synced by separate APIs when needed; the canonical identity is the Nhost user UUID.

---

## Routes and UI Entry Points

| Route / entry | Purpose |
|---------------|--------|
| **Sign In** | Modal (AuthModalWrapper → SigninModal → LoginPage) or dedicated page. Email/password + “Continue with Google”. “Forgot Password?” opens ForgotPassword modal. |
| **Register** | Modal (SignupModal → RegisterPage) or dedicated page. Email/password form + “Continue with Google”. |
| **Forgot Password** | Modal (ForgotPasswordModal → ForgotPasswordPage). Submits email; Nhost sends reset link to `${origin}/reset-password`. |
| **/reset-password** | Page that renders UpdatePasswordForm. User lands here from email link with `?refreshToken=...`; Nhost exchanges token for session; user sets new password. |
| **/user-verification** | Shown when `nhostUser` exists and `!emailVerified`. Resend verification email; after clicking link, Nhost redirects to `/user-verification?verified=1` then app redirects to home or onboarding. |
| **/onboarding** | Shown when `user.onboarding_complete === false` (and email verified). OnboardingRedirect sends users here until they complete onboarding. |
| **Settings → Password** | Logged-in user can request a password-reset email (same flow as forgot password); Google users see provider message. |

Constants (e.g. in `constants/pages.ts`): `HOME`, `LOGIN`, `REGISTER`, `USER_VERIFICATION`, `ONBOARDING_ONE`, etc.

---

## Security and Server-Side Auth

- **JWT verification:** For API routes that need the current user, use **`lib/nhost-server-auth.ts`**: `verifyNhostToken(authHeader)` to validate the Nhost access token and get `userId` and user payload.
- **Authorization header:** Clients send `Authorization: Bearer <accessToken>`. The access token comes from the Nhost session (e.g. `nhost.auth.getSession()` or similar).
- **Redirect URLs:** Nhost dashboard must allow redirect URLs for OAuth and password reset (e.g. `https://yourdomain.com`, `https://yourdomain.com/reset-password`, `https://yourdomain.com/user-verification`).

---

## Edge Cases and Error Handling

- **Already signed in:** Sign-in with email/password may return Nhost “already-signed-in”; the service treats it as success and uses the current session.
- **Email not verified:** Sign-in and OAuth flows redirect to `/user-verification` and show resend/verify UI; API may enforce verified users only.
- **Profile missing:** After first sign-in/sign-up, if `user_profiles` (or app profile API) returns 404, the auth service can create a default profile so the user can proceed to onboarding.
- **OAuth error in URL:** OAuthCallbackHandler checks for `?error=...` and shows a toast (e.g. “Google sign-in failed”) and clears OAuth sessionStorage.
- **Invalid or expired reset link:** UpdatePasswordForm shows “This reset password link is invalid or has already expired” when the token cannot be exchanged or user is not authenticated after loading.
- **Verification email server errors:** Resend verification maps 500-like errors to a user-friendly “couldn’t send right now” message.
- **Session storage cleanup:** On sign-out, OAuth and onboarding flags are cleared (`oauth_pending`, `post_oauth_redirect`, etc.) so the next login does not reuse old state.

---

## Summary Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TastyPlates Auth (Nhost)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Sign-in          → nhost.auth.signIn / Google redirect                 │
│  Sign-up          → nhost.auth.signUp + user_profiles insert            │
│  Forgot password  → nhost.auth.resetPassword(email, redirectTo)         │
│  Reset password   → Land on /reset-password?refreshToken=… → session     │
│                    → nhost.auth.changePassword(newPassword)              │
│  Email verify     → /user-verification + resendVerificationEmail        │
│  Session          → useNhostSession = Nhost auth + get-restaurant-user  │
└─────────────────────────────────────────────────────────────────────────┘
```

This document reflects the current Nhost-based authentication, registration, and password reset flows in TastyPlates. For implementation details, refer to the source files listed in the Architecture and Technical Implementation sections.
