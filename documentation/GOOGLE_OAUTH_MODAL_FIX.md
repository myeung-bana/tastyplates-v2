# Google OAuth Modal Fix

## Summary

Fixed the "Continue with Google" button functionality in both SigninModal and SignupModal by implementing a proper modal-closing flow before OAuth redirect.

## Problem

Previously, when users clicked "Continue with Google" in the modal:
1. The page would redirect to Google while the modal was still open
2. After Google authentication, users would return to the page but the modal context was lost
3. The loading state would get stuck
4. The OAuth flow appeared broken from a UX perspective

## Solution Implemented

**Option 1: Close Modal Before Redirect**

### Changes Made

#### 1. `src/pages/Login/Login.tsx` (loginWithGoogle function)
- Removed `setIsLoading(true)` that couldn't complete due to page redirect
- Added modal close logic: `if (onLoginSuccess) onLoginSuccess()` to close the modal before redirecting
- Added 300ms delay to allow modal close animation to complete
- Changed redirect URL from `window.location.href` to `window.location.origin` to return to homepage after OAuth

#### 2. `src/pages/Register/Register.tsx` (signUpWithGoogle function)
- Removed `setIsLoading(true)` that couldn't complete due to page redirect
- Added 300ms delay to allow modal close animation to complete
- Changed redirect URL from `window.location.href` to `window.location.origin` to return to homepage after OAuth

### How It Works Now

**Login Flow:**
1. User clicks "Continue with Google" in SigninModal
2. Modal closes immediately
3. 300ms delay for animation
4. Page redirects to Google OAuth
5. User authenticates with Google
6. Google redirects to `/api/auth/google-callback`
7. Callback route processes OAuth and creates session
8. User is redirected to homepage (logged in)

**Signup Flow:**
1. User clicks "Continue with Google" in SignupModal
2. Modal closes with 300ms delay for animation
3. Page redirects to Google OAuth
4. User authenticates with Google
5. Google redirects to `/api/auth/google-callback`
6. Callback route auto-registers user with minimal data
7. User is redirected to `/onboarding` to complete profile

## Google Cloud Console Configuration

### Required Settings

1. **Go to Google Cloud Console** → APIs & Services → Credentials

2. **Create OAuth 2.0 Client ID** (if not already created):
   - Application type: Web application
   - Name: TastyPlates (or your app name)

3. **Add Authorized Redirect URIs**:

   **For Development:**
   ```
   http://localhost:3000/api/auth/google-callback
   ```

   **For Production:**
   ```
   https://www.tastyplates.co/api/auth/google-callback
   ```
   
   (Replace `www.tastyplates.co` with your actual production domain)

4. **Copy Credentials:**
   - Copy the Client ID
   - Copy the Client Secret

### Environment Variables

Add these to your `.env.local` (development) and production environment:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration (required)
NEXTAUTH_URL=http://localhost:3000  # For development
NEXTAUTH_SECRET=your_nextauth_secret_here  # Generate with: openssl rand -base64 32
```

**Production `.env`:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
NEXTAUTH_URL=https://www.tastyplates.co
NEXTAUTH_SECRET=your_production_secret
```

## Testing

### Login Flow Test
1. Go to homepage
2. Click "Sign In"
3. Click "Continue with Google"
4. Modal should close
5. Google login page should appear
6. After authentication, should return to homepage (logged in)

### Signup Flow Test
1. Go to homepage
2. Click "Sign Up"
3. Click "Continue with Google"
4. Modal should close after 300ms
5. Google login page should appear
6. After authentication, should be redirected to `/onboarding` to complete profile

## Technical Details

### Redirect URL Strategy

**Before:** `window.location.href` (e.g., `http://localhost:3000/?modal=signin`)
- Problem: Includes query params or path that might not exist after redirect

**After:** `window.location.origin` (e.g., `http://localhost:3000`)
- Benefit: Always returns to clean homepage URL, which is a safe landing page

### Modal Close Timing

- 300ms delay allows CSS transitions to complete smoothly
- Provides better UX by not abruptly redirecting mid-animation

### Why Full Page Redirect?

Google OAuth requires a full page redirect for security reasons:
1. OAuth happens in the browser's main window
2. The authorization code is passed via URL query params
3. This cannot happen in a modal without a popup (which has UX issues)

## Troubleshooting

### "Google OAuth is not configured"
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart your Next.js dev server after adding env variables

### "Failed to authenticate with Google"
- Verify redirect URI in Google Cloud Console matches exactly
- Check that `GOOGLE_CLIENT_SECRET` is set (server-side only)
- Check browser console and server logs for specific errors

### "No account found. Please sign up first."
- This is expected for login flow when user doesn't exist
- User should use the Sign Up flow instead

### Modal doesn't close
- Verify `onLoginSuccess` prop is passed to `LoginPage` component
- Check browser console for JavaScript errors

## Fallback Error Handling

### Issue: 404 Error After Google OAuth Redirect

**Problem**: When Google OAuth auto-registration failed, the callback route redirected to `/register` which doesn't exist as a page (only as a modal), causing 404 errors.

**Solution**: All fallback redirects now go to `HOME` instead of `REGISTER` with appropriate error messages in cookies.

### Changes Made (November 17, 2025)

1. **Replaced all REGISTER fallback redirects with HOME**:
   - Signup flow when user already exists → HOME with error
   - Auto-registration failure → HOME with error
   - Token generation failure → HOME with error
   - Auto-registration exception → HOME with error
   - Login flow when user doesn't exist → HOME with error

2. **Added comprehensive logging**:
   - Log auto-registration attempt with user data
   - Log registration result (success/failure, user ID, errors)
   - Log token generation result
   - Log all error conditions with context
   - Log exception details in catch blocks

3. **Enhanced error messages**:
   - Clear distinction between login and signup flow errors
   - Specific messages for each failure scenario
   - All errors displayed to user via `googleError` cookie

### Logging Format

The callback route now logs:
- **Registration attempt**: Email, username, OAuth status, profile image availability
- **Registration result**: Success status, user ID, error codes/messages
- **Token generation**: Token presence, user ID
- **Failures**: Specific error context for debugging

### Expected User Experience

- **Successful signup**: User is auto-registered and redirected to `/onboarding`
- **Failed signup**: User sees error message on home page, can try manual signup
- **User already exists**: User sees message to sign in instead, stays on home page
- **Failed login**: User sees error message on home page, can retry

## Related Files

- `src/pages/Login/Login.tsx` - Login form with Google OAuth
- `src/pages/Register/Register.tsx` - Registration form with Google OAuth
- `src/components/auth/SigninModal.tsx` - Sign-in modal wrapper
- `src/components/auth/SignupModal.tsx` - Sign-up modal wrapper
- `src/app/api/auth/google-callback/route.ts` - OAuth callback handler (updated with logging)
- `src/app/api/auth/authOptions.ts` - NextAuth configuration

## Date Implemented

November 17, 2025

---

## Popup-Based OAuth Flow Update (November 17, 2025)

### New Issue: Full-Page Redirects + User Creation Failures

**Problems Identified**:
1. Full-page redirect (`window.location.href`) destroyed modal state
2. Poor UX - users lost their place on the page
3. Users not being created in WordPress after Google OAuth signup
4. ACF boolean field `is_google_user` not saving correctly

**Root Cause**:
- JavaScript sent `is_google_user: true` (boolean)
- WordPress saved as `"true"` (string)
- ACF validation checks for `'1'` (string)
- Result: User creation succeeded but not recognized as Google user

### Solution: Popup OAuth + ACF Boolean Fix

#### 1. Popup-Based OAuth Flow

**Changes to `src/pages/Register/Register.tsx` & `src/pages/Login/Login.tsx`**:
- Replaced full-page redirect with `window.open()` popup
- Popup dimensions: 500x600, centered on screen
- Parent window monitors authentication via **cookie polling** (not `popup.closed`)
- **COOP Error Avoidance**: Uses cookie polling every 500ms to detect completion, avoiding Cross-Origin-Opener-Policy errors entirely
- Polls cookies to detect authentication status:
  - `google_oauth_pending` → Success
  - `googleError` → Display error
- **Signup flow**: Redirects to `/onboarding` on success
- **Login flow**: Triggers NextAuth `signIn()` on success
- Handles popup blockers with user-friendly error
- 5-minute timeout (600 checks × 500ms)

**Changes to `src/app/api/auth/google-callback/route.ts`**:
- Created `createPopupCloseResponse()` helper
- Returns HTML that automatically closes popup
- Sets cookies before closing (visible to parent)
- Created `createPopupErrorResponse()` for errors
- Replaced all `NextResponse.redirect()` calls with popup close responses

#### 2. ACF Boolean Field Fix

**Changes to `documentation/tastyplates-user-rest-api-plugin.php`** (Lines 3276-3282):
```php
// Special handling for is_google_user: ACF boolean fields require '1' or '0' as strings
if ($acf_field === 'is_google_user' && isset($userdata[$acf_field])) {
  // Convert any truthy value to string '1', falsy to string '0'
  $value = ($userdata[$acf_field] === true || $userdata[$acf_field] === 'true' || 
            $userdata[$acf_field] === 1 || $userdata[$acf_field] === '1') ? '1' : '0';
  update_user_meta($user_id, $acf_field, $value);
  error_log("[TastyPlates] Saved is_google_user as: '{$value}' for user {$user_id}");
}
```

**Why This Works**:
- ACF stores booleans as string `'1'` (true) or `'0'` (false)
- Explicit conversion handles all input formats
- Logging confirms correct value saved

### Benefits

1. **Better UX**:
   - Modal state preserved
   - Users stay on current page
   - Faster authentication flow
   
2. **Reliable User Creation**:
   - Google OAuth users now created successfully
   - `is_google_user` field saved correctly
   - Password validation skipped for OAuth users

3. **Cleaner Error Handling**:
   - All errors close popup automatically
   - Error messages displayed in parent window
   - No more 404 errors from redirects

### Testing

1. **Signup with Google**:
   - ✅ Popup opens centered
   - ✅ Authenticate in popup
   - ✅ Popup closes automatically
   - ✅ User created with `is_google_user = '1'`
   - ✅ Redirected to `/onboarding`

2. **Login with Google**:
   - ✅ Popup opens centered
   - ✅ Authenticate in popup
   - ✅ Popup closes automatically
   - ✅ NextAuth session created
   - ✅ User logged in successfully

3. **Error Scenarios**:
   - ✅ Popup blocked → Clear error message
   - ✅ Auth cancelled → Popup closes with error
   - ✅ Existing user signup → Error shown
   - ✅ Non-existent user login → Error shown

### Updated Files

- `src/pages/Register/Register.tsx` - Popup OAuth for signup + specific cookie cleanup
- `src/pages/Login/Login.tsx` - Popup OAuth for login + specific cookie cleanup
- `src/app/api/auth/google-callback/route.ts` - Popup close responses + debug logging
- `documentation/tastyplates-user-rest-api-plugin.php` - ACF boolean fix

### Technical Notes

#### COOP (Cross-Origin-Opener-Policy) Error Avoidance

**Issue**: When monitoring the popup window, the browser throws a COOP error when trying to access `popup.closed` while the popup is on Google's domain (different origin).

**Error Message**: `"Cross-Origin-Opener-Policy policy would block the window.closed call."`

**Initial Solution Attempt**: Wrapped `popup.closed` checks in try-catch blocks - this prevented crashes but the browser still logged COOP errors to the console (errors are logged before exception is caught).

**Key Insight**: Even with try-catch, the browser logs COOP errors **before** JavaScript can catch them. The only way to avoid console errors is to **never access `popup.closed` at all**.

**Final Solution**: **Cookie Polling** - Completely avoid checking `popup.closed`:

```javascript
// Monitor for authentication completion by polling cookies
// This avoids COOP errors from checking popup.closed across different origins
let popupCheckCount = 0;
const maxChecks = 600; // 5 minutes at 500ms intervals

const checkPopup = setInterval(() => {
  popupCheckCount++;
  
  // Check if authentication succeeded by looking for cookies
  const hasPendingAuth = Cookies.get('google_oauth_pending');
  const hasError = Cookies.get('googleError');
  
  if (hasError) {
    // Handle error...
  } else if (hasPendingAuth) {
    // Authentication succeeded...
  } else if (popupCheckCount >= maxChecks) {
    // Timeout after 5 minutes...
  }
}, 500);
```

**Why This Works**:
- **Zero `popup.closed` checks**: We completely removed all `popup.closed` checks from parent window code - not even in try-catch blocks
- **Cookie-based detection**: Callback route sets cookies (`google_oauth_pending` or `googleError`) which are readable by parent window
- **Automatic popup close**: The callback route returns HTML that closes the popup automatically via `window.close()` executing in popup context
- **Timeout protection**: After 600 checks (5 minutes), we stop polling and show timeout error (popup auto-closes via callback)
- **Clean experience**: Absolutely no browser console errors, completely silent polling until completion

#### Auth Type Cookie Persistence Issue (Fixed November 17, 2025)

**Issue**: When using Google OAuth for signup, the WordPress backend was returning a 404 "User not found" error, and the callback route was treating it as a login attempt instead of proceeding with auto-registration.

**Root Cause**: The `removeAllCookies()` function was being called in both `Register.tsx` and `Login.tsx`, which removed ALL cookies including the crucial `auth_type` cookie that distinguishes between login and signup flows.

**Timeline**:
```typescript
// Register.tsx
removeAllCookies();  // ❌ Removes all cookies
Cookies.set('auth_type', 'signup'); // Sets AFTER delete
```

While the timing should work (set happens after delete), there were edge cases where the cookie wasn't persisting correctly.

**Solution**: Replace `removeAllCookies()` with targeted cookie removal:

```typescript
// Remove only old OAuth-related cookies (don't use removeAllCookies to preserve session)
Cookies.remove('google_oauth_token');
Cookies.remove('google_oauth_user_id');
Cookies.remove('google_oauth_email');
Cookies.remove('google_oauth_pending');
Cookies.remove('googleError');
Cookies.remove('onboarding_data');
Cookies.remove('google_oauth_redirect');
Cookies.remove('auth_type');

// Then set new cookies
Cookies.set('google_oauth_redirect', window.location.origin, ...);
Cookies.set('auth_type', sessionType.signup, ...); // ✅ Will persist
```

**Debug Logging Added**:
- Frontend logs when setting `auth_type` cookie
- Callback route logs when reading `auth_type` cookie
- Callback route logs comparison with `sessionType.signup`
- Callback route logs which flow branch is executed (login vs signup)

**Expected Console Output for Signup**:
```
🔍 Register: Set auth_type cookie to: signup
🔍 Callback: Retrieved auth_type from cookie: signup
🔍 Callback: sessionType.signup value: signup
🔍 Callback: Is signup flow? true
✅ SIGNUP FLOW DETECTED - Processing signup logic
✅ WordPress OAuth result: { hasToken: false, hasId: false, status: 404 }
✅ User does not exist - Starting auto-registration
```

