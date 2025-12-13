# Authentication System

## Overview

This application uses **Firebase Authentication** as the primary Single Sign-On (SSO) system. This approach eliminates the need for NextAuth and prevents HTTP 431 errors caused by excessive cookies.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                       │
└─────────────────────────────────────────────────────────────────┘

User Login/Register
       ↓
Firebase Authentication
  (Email/Password or Google OAuth)
       ↓
Firebase sets session cookies
       ↓
User created/fetched from Hasura
  (using firebase_uuid)
       ↓
Application uses Firebase session
  for all authenticated requests
```

## Key Components

### 1. Client-Side

#### Firebase Auth Service
**Location:** `src/services/auth/firebaseAuthService.ts`

Handles all Firebase authentication operations:
- Email/password sign-in and registration
- Google OAuth sign-in
- User creation in Hasura after Firebase authentication

#### Custom Session Hook
**Location:** `src/hooks/useFirebaseSession.ts`

Replaces NextAuth's `useSession` hook:

```typescript
import { useFirebaseSession } from '@/hooks/useFirebaseSession';

function MyComponent() {
  const { user, firebaseUser, loading, error } = useFirebaseSession();
  
  if (loading) return <Spinner />;
  if (!user) return <LoginPrompt />;
  
  return <div>Welcome {user.display_name}</div>;
}
```

**Features:**
- Listens to Firebase auth state changes via `onAuthStateChanged`
- Automatically fetches Hasura user data when authenticated
- Provides loading states and error handling

#### Login/Register Components
**Locations:** 
- `src/pages/Login/Login.tsx`
- `src/pages/Register/Register.tsx`

**Key Changes:**
- ❌ Removed NextAuth `signIn()` calls
- ✅ Direct Firebase authentication
- ✅ No cookie manipulation needed
- ✅ Session automatically managed by Firebase

### 2. Server-Side

#### Proxy Middleware
**Location:** `proxy.ts` (root level)

Replaces NextAuth middleware with Firebase token verification:

```typescript
// Uses Firebase Admin SDK to verify tokens
// Adds user info to request headers for API routes
export async function proxy(request: NextRequest) {
  // Verify Firebase ID token or session cookie
  // Add x-firebase-uid header for API routes
}
```

**Features:**
- Verifies Firebase ID tokens from Authorization header
- Verifies Firebase session cookies
- Adds `x-firebase-uid` header to authenticated requests
- Protects routes like `/settings`, `/dashboard`, `/profile/edit`

#### User Session API
**Location:** `src/app/api/user/me/route.ts`

Fetches current user data from Hasura:

```typescript
// GET /api/user/me
// Returns user data based on Firebase token
```

**Usage:**
```typescript
const response = await fetch('/api/user/me');
const { success, data } = await response.json();
```

### 3. Environment Variables

#### Client-Side (Firebase SDK)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

#### Server-Side (Firebase Admin SDK)
```bash
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- Get server-side credentials from Firebase Console → Project Settings → Service Accounts
- Download the service account JSON file
- The private key must include newlines (`\n`)

#### Google OAuth
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Migration from NextAuth

### What Was Removed
- ❌ `next-auth` dependency (optional - can keep for other providers)
- ❌ `src/app/api/auth/[...nextauth]/route.ts`
- ❌ `src/app/api/auth/authOptions.ts`
- ❌ `src/app/api/auth/google-callback/route.ts`
- ❌ All `signIn('credentials', ...)` calls
- ❌ `useSession()` from `next-auth/react`
- ❌ `withAuth()` middleware

### What Was Added
- ✅ `firebase-admin` package
- ✅ `src/hooks/useFirebaseSession.ts`
- ✅ `src/app/api/user/me/route.ts`
- ✅ Updated `proxy.ts` with Firebase Admin verification
- ✅ Environment variables documentation

## Authentication Flows

### Email/Password Login

```typescript
// 1. User enters email/password
const result = await firebaseAuthService.signInWithEmail(email, password);

// 2. Firebase authenticates and sets session
// 3. firebaseAuthService fetches/creates user in Hasura
// 4. onAuthStateChanged triggers in useFirebaseSession
// 5. User data automatically loaded

// 6. Navigate to home
router.push('/');
```

### Google OAuth Login

```typescript
// 1. User clicks "Continue with Google"
const result = await firebaseAuthService.signInWithGoogle();

// 2. Firebase popup authentication
// 3. Firebase session automatically set
// 4. firebaseAuthService creates user in Hasura if new
// 5. onAuthStateChanged triggers
// 6. User data loaded

// 7. Navigate to home
router.push('/');
```

### Email/Password Registration

```typescript
// 1. User enters email/password
const result = await firebaseAuthService.registerWithEmail(email, password);

// 2. Firebase creates user account
// 3. User created in Hasura
// 4. Firebase session set
// 5. onAuthStateChanged triggers

// 6. Navigate to onboarding
router.push('/onboarding');
```

## Protected Routes

Routes requiring authentication are configured in `proxy.ts`:

```typescript
export const config = {
  matcher: [
    "/settings/:path*",
    "/profile",
    "/profile/edit",
    "/dashboard/:path*",
    "/add-review/:path*",
    "/edit-review/:path*",
    "/onboarding/:path*",
    "/following/:path*",
    "/api/:path*",
  ],
};
```

Unauthenticated users are redirected to `/` with a `callbackUrl` parameter.

## API Authentication

### Client-Side API Calls

Firebase automatically includes ID token in requests:

```typescript
import { auth } from '@/lib/firebase';

async function apiCall() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const token = await user.getIdToken();
  
  const response = await fetch('/api/some-endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

### Server-Side API Routes

Access Firebase UID from request headers:

```typescript
export async function GET(request: NextRequest) {
  const firebaseUid = request.headers.get('x-firebase-uid');
  
  if (!firebaseUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Fetch user from Hasura using firebase_uid
  const user = await getUserByFirebaseUuid(firebaseUid);
  
  return NextResponse.json({ user });
}
```

## Benefits of Firebase SSO

### Before (Dual System)
- Firebase cookies: ~2-3KB
- NextAuth cookies: ~4-6KB
- Custom OAuth cookies: ~2KB
- **Total: 8-11KB ❌ (exceeds header limit)**

### After (Firebase Only)
- Firebase cookies: ~2-3KB
- **Total: 2-3KB ✅ (well under limit)**

### Other Benefits
1. **No HTTP 431 errors** - Single auth system prevents cookie accumulation
2. **Industry standard** - Firebase is a battle-tested SSO provider
3. **Simpler codebase** - One authentication system instead of two
4. **Better performance** - Fewer round-trips, automatic session management
5. **Easier maintenance** - Single source of truth for authentication
6. **Built-in security** - Firebase handles token refresh, validation, etc.

## Troubleshooting

### User not found after authentication

**Symptom:** Firebase authentication succeeds but user data not loaded

**Solution:** Check that:
1. Hasura is accessible from your environment
2. `firebaseAuthService` successfully creates user in Hasura
3. User exists in `restaurant_users` table with correct `firebase_uuid`

### Session not persisting

**Symptom:** User logged in but session lost on refresh

**Solution:** Check that:
1. Firebase cookies are being set (check browser DevTools → Application → Cookies)
2. `useFirebaseSession` hook is mounted in your component tree
3. `onAuthStateChanged` listener is active

### Firebase Admin SDK not initialized

**Symptom:** Error: "Firebase Admin SDK not initialized"

**Solution:** Check that:
1. Environment variables are set correctly in `.env.local`
2. `FIREBASE_PRIVATE_KEY` includes newline characters (`\n`)
3. Service account has proper permissions in Firebase Console

### Protected routes not working

**Symptom:** Can access protected routes without authentication

**Solution:** Check that:
1. `proxy.ts` is in the root directory (not in `src/`)
2. Routes are included in `config.matcher` array
3. Firebase Admin SDK is initialized properly

## Testing Authentication

### Manual Testing

1. **Email/Password:**
   ```bash
   # Register new user
   # Login with credentials
   # Verify session persists on refresh
   ```

2. **Google OAuth:**
   ```bash
   # Click "Continue with Google"
   # Complete Google authentication
   # Verify user created in Hasura
   # Verify session persists
   ```

3. **Protected Routes:**
   ```bash
   # Try accessing /settings without login → should redirect to /
   # Login and access /settings → should work
   # Logout and access /settings → should redirect
   ```

### Debugging Tools

1. **Browser DevTools:**
   - Application → Cookies: Check Firebase cookies
   - Network: Verify Firebase token in Authorization header
   - Console: Check for Firebase auth state changes

2. **Firebase Console:**
   - Authentication → Users: Verify user created
   - Check sign-in methods are enabled

3. **Hasura Console:**
   - Data → restaurant_users: Verify user exists
   - Check `firebase_uuid` matches Firebase user UID

## Future Enhancements

- [ ] Add Firebase session cookie creation for better SSR support
- [ ] Implement email verification flow
- [ ] Add phone authentication provider
- [ ] Set up Firebase security rules
- [ ] Add refresh token rotation
- [ ] Implement remember me functionality
- [ ] Add two-factor authentication (2FA)

## References

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Hasura GraphQL Documentation](https://hasura.io/docs/latest/graphql/core/index.html)
