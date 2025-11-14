# Authentication Modal Fixes

## Changes Made

### 1. Updated Login Flow (`src/pages/Login/Login.tsx`)

**Key Changes:**
- Changed `redirect: true` to `redirect: false` for both credentials and Google login
- Added `onLoginSuccess` callback to close modal after successful login
- Added session refresh using `update()` from `useSession()`
- Improved OAuth redirect flow handling
- Better error handling and loading state management

**Before:**
```typescript
await signIn(provider.credentials, {
  redirect: true,  // ❌ Causes full page redirect
  callbackUrl: HOME
});
```

**After:**
```typescript
const result = await signIn(provider.credentials, {
  redirect: false,  // ✅ Stay in modal context
  callbackUrl: typeof window !== 'undefined' ? window.location.href : HOME
});

if (result?.ok) {
  await update(); // Refresh session
  onLoginSuccess?.(); // Close modal
  router.refresh();
  setTimeout(() => router.push(HOME), 100);
}
```

### 2. Updated SigninModal (`src/components/auth/SigninModal.tsx`)

**Changes:**
- Added `onLoginSuccess={onClose}` prop to `LoginPage` component
- Modal now closes automatically after successful login

### 3. Google OAuth Flow

**Improvements:**
- Properly handles OAuth redirect by checking for `result.url`
- If `result.url` exists, redirects to Google OAuth provider
- After OAuth callback, session is refreshed and modal closes

## Required Environment Variables

### For Local Development

Add to your `.env.local` file:

```env
# NextAuth Configuration (REQUIRED for OAuth to work)
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_nextauth_secret
```

### For Production

```env
NEXTAUTH_URL=https://www.tastyplates.co
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
NEXTAUTH_SECRET=your_production_nextauth_secret
```

## Google OAuth Configuration

### Important: Redirect URI Setup

In your Google Cloud Console, make sure you have these authorized redirect URIs:

**For Local Development:**
- `http://localhost:3000/api/auth/callback/google`
- `http://127.0.0.1:3000/api/auth/callback/google` (if using 127.0.0.1)

**For Production:**
- `https://www.tastyplates.co/api/auth/callback/google`

### Steps to Configure:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Add the redirect URIs listed above
6. Save changes

## Testing the Fixes

### 1. Test Credentials Login:
1. Open the signin modal
2. Enter email and password
3. Click "Continue"
4. Modal should close automatically
5. Session should be updated
6. User should be redirected to home page

### 2. Test Google OAuth:
1. Open the signin modal
2. Click "Continue with Google"
3. Should redirect to Google OAuth page
4. After authentication, should return to app
5. Modal should be closed
6. Session should be updated

### 3. Test Error Handling:
1. Try invalid credentials
2. Error message should display
3. Modal should remain open
4. Loading state should be cleared

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch" Error
**Solution:** Make sure the redirect URI in Google Cloud Console matches exactly:
- `http://localhost:3000/api/auth/callback/google` (no trailing slash)
- Check that `NEXTAUTH_URL` is set correctly

### Issue: Modal Doesn't Close After Login
**Solution:** 
- Check that `onLoginSuccess` callback is being called
- Verify session is updating with `router.refresh()`
- Check browser console for errors

### Issue: Session Not Updating After Login
**Solution:**
- Ensure `update()` is being called from `useSession()`
- Check that `router.refresh()` is called
- Verify NextAuth session configuration

### Issue: OAuth Redirect Not Working in Local Development
**Solution:**
- Verify `NEXTAUTH_URL=http://localhost:3000` is set
- Check Google Cloud Console redirect URIs
- Clear browser cookies and try again
- Check that port matches (3000 or your dev port)

## Best Practices Implemented

1. ✅ **Modal-friendly authentication**: Using `redirect: false` prevents full-page redirects
2. ✅ **Proper session management**: Using `update()` and `router.refresh()` ensures session is current
3. ✅ **Better UX**: Modal closes automatically after successful login
4. ✅ **Error handling**: Proper error states and loading indicators
5. ✅ **OAuth flow**: Correctly handles OAuth redirect flow with `result.url` check

## Additional Notes

- The `setTimeout` delay (100ms) ensures session is fully updated before navigation
- `router.refresh()` is important to update server components with new session data
- `update()` from `useSession()` forces a session refresh on the client side
- For Google OAuth, the redirect happens automatically when `result.url` exists

