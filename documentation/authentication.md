# Dropiti Authentication System

Complete documentation of the authentication implementation, product flow, and features for the Dropiti platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Product Flow](#product-flow)
4. [Features](#features)
5. [Technical Implementation](#technical-implementation)
6. [User Experience Flow](#user-experience-flow)
7. [Security Features](#security-features)
8. [Benefits](#benefits)
9. [Edge Cases Handled](#edge-cases-handled)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Dropiti platform implements a **dual authentication system** that supports both traditional email/password authentication (via Firebase) and **Google OAuth 2.0** for quick registration and login. The system provides seamless account linking, automatic user creation, and unified session management.

### Key Highlights

- **One-click Google authentication** for faster onboarding
- **Automatic account linking** by email to prevent duplicate accounts
- **Unified session management** across all authentication methods
- **Secure OAuth 2.0 flow** with proper token handling
- **Robust error handling** with user-friendly feedback

---

## Architecture

### Technology Stack

- **NextAuth.js**: OAuth provider and session management
- **Firebase Auth**: Email/password authentication backend
- **Google OAuth 2.0**: Social authentication provider
- **Hasura GraphQL**: User data persistence layer
- **JWT**: Session token management

### Component Structure

#### 1. Authentication Provider
**Location**: `src/app/api/auth/authOptions.ts`

- **Credentials Provider**: Email/password authentication via Firebase
- **Google Provider**: OAuth 2.0 authentication

#### 2. UI Components

- **`SignInForm.tsx`**: Sign-in form with Google authentication option
- **`SignUpForm.tsx`**: Sign-up form with Google authentication option
- **`GoogleSignInButton.tsx`**: Reusable Google authentication button component

#### 3. Page Routes

- **`/auth/signin`**: Sign-in page (`src/app/auth/signin/page.tsx`)
- **`/auth/signup`**: Sign-up page (`src/app/auth/signup/page.tsx`)

---

## Product Flow

### Google Sign-In Flow

```
User clicks "Continue with Google"
    ↓
GoogleSignInButton component triggers NextAuth signIn('google')
    ↓
User redirected to Google OAuth consent screen
    ↓
User grants permissions
    ↓
Google redirects back with authorization code
    ↓
NextAuth exchanges code for tokens
    ↓
signIn callback executes:
    1. Extract email from Google profile
    2. Query database for existing user by email
    3a. If user exists → Link account (reuse existing firebase_uid)
    3b. If new user → Create user in database with Google providerAccountId
    ↓
JWT callback creates session token
    ↓
Session callback creates user session
    ↓
User redirected to dashboard (or callbackUrl)
    ↓
Success toast notification shown
```

### Google Sign-Up Flow

```
User clicks "Continue with Google" on signup page
    ↓
Same OAuth flow as sign-in
    ↓
signIn callback checks for existing user:
    - If email exists → Links to existing account (acts as sign-in)
    - If new email → Creates new user record
    ↓
New user automatically created with:
    - firebase_uid: Google providerAccountId
    - display_name: Google profile name
    - email: Google email
    - photo_url: Google profile picture
    - auth_provider: 'google'
    ↓
User session created
    ↓
Redirected to dashboard
```

### Email/Password Sign-Up Flow (For Comparison)

```
User fills form (name, email, password, confirm password)
    ↓
Client-side validation
    ↓
Create Firebase Auth user
    ↓
Update Firebase profile with display name
    ↓
Send email verification (non-blocking)
    ↓
Create user in Hasura database
    ↓
Redirect to sign-in page with success message
```

### Email/Password Sign-In Flow

```
User enters email and password
    ↓
Form validation
    ↓
Firebase authentication
    ↓
NextAuth credentials provider validates
    ↓
Session created
    ↓
Redirect to dashboard
```

---

## Features

### 1. Account Linking

- **Existing User Detection**: When a user signs in with Google, the system checks if an account with that email already exists
- **Automatic Linking**: If found, the Google account is linked to the existing account using the existing `firebase_uid`
- **Prevents Duplicates**: Ensures one user = one account, regardless of authentication method

### 2. Automatic User Creation

- **New User Detection**: If no account exists with the Google email, a new user is automatically created
- **Profile Data Extraction**: Automatically extracts name, email, and profile picture from Google
- **Database Integration**: Creates user record in Hasura database with proper `auth_provider` flag

### 3. Unified Authentication

- **Single Session System**: Both email/password and Google authentication use the same NextAuth session system
- **Consistent Experience**: Users have the same experience regardless of authentication method
- **JWT-Based Sessions**: All sessions use JWT tokens for stateless authentication

### 4. Session Management

- **Default Duration**: 30 days for standard sessions
- **Extended Duration**: 90 days when "Remember Me" is enabled (email/password)
- **Secure Cookies**: HTTP-only cookies with secure flags in production
- **Token Refresh**: Automatic token refresh mechanism

### 5. Error Handling

- **Toast Notifications**: User-friendly success/error messages
- **Graceful Degradation**: System continues to function even if non-critical operations fail
- **Detailed Logging**: Comprehensive server-side logging for debugging

### 6. User Experience Enhancements

- **One-Click Authentication**: Google users can sign in/up with a single click
- **Visual Feedback**: Loading states and disabled buttons during authentication
- **Smart Redirects**: Redirects to intended destination (`callbackUrl` support)
- **Responsive Design**: Works seamlessly on all device sizes

---

## Technical Implementation

### Environment Variables

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials
NEXT_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FIREBASE_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Hasura Configuration
HASURA_ENDPOINT=https://your-hasura-instance.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret
```

### Database Schema

Users are stored in the `real_estate.user` table with the following key fields:

- **`firebase_uid`**: Unique identifier (Google `providerAccountId` for Google users, Firebase UID for email/password users)
- **`email`**: User email address (lowercase, unique)
- **`display_name`**: User's display name
- **`photo_url`**: Profile picture URL
- **`auth_provider`**: Authentication provider ('google', 'firebase', 'google.com')

### Key Callbacks

#### 1. `signIn` Callback

**Location**: `src/app/api/auth/authOptions.ts`

Handles Google OAuth account linking and user creation:

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === 'google') {
    // Extract email
    const email = (user.email || profile?.email || '').toLowerCase();
    
    // Check for existing user
    const existing = await executeQuery(GET_USER_BY_EMAIL, { email });
    
    if (existingUser) {
      // Link to existing account
      user.id = existingUser.firebase_uid;
      return true;
    }
    
    // Create new user
    const newUser = {
      firebase_uid: account.providerAccountId,
      display_name: displayName,
      email,
      photo_url: photoUrl,
      auth_provider: 'google',
    };
    
    await executeMutation(INSERT_USER, { user: newUser });
    user.id = account.providerAccountId;
    return true;
  }
  
  return true;
}
```

#### 2. `jwt` Callback

Creates and manages JWT tokens:

- Stores user ID and role in token
- Handles "Remember Me" expiration extension
- Manages token refresh

#### 3. `session` Callback

Builds the session object returned to the client:

- Adds user ID and role to session
- Manages session expiration
- Returns session data

### GraphQL Queries

#### Get User by Email

```graphql
query GetUserByEmail($email: String!) {
  real_estate_user(where: { email: { _eq: $email } }, limit: 1) {
    uuid
    firebase_uid
    display_name
    email
    photo_url
    auth_provider
  }
}
```

#### Insert User

```graphql
mutation InsertUser($user: real_estate_user_insert_input!) {
  insert_real_estate_user_one(object: $user) {
    uuid
    firebase_uid
    display_name
    email
    photo_url
    auth_provider
  }
}
```

---

## User Experience Flow

### Sign-In Page (`/auth/signin`)

1. **User lands on sign-in page**
   - Split-screen layout with form on left, content on right
   - Shows welcome message and platform features

2. **Authentication Options**:
   - **Email/Password Form**: Traditional sign-in with email and password
   - **"Continue with Google" Button**: One-click Google authentication

3. **Google Authentication Flow**:
   - User clicks "Continue with Google" button
   - Redirected to Google OAuth consent screen
   - User grants permissions
   - Redirected back to application
   - Success toast notification
   - Redirected to dashboard (or `callbackUrl`)

4. **Email/Password Flow**:
   - User enters email and password
   - Optional "Remember Me" checkbox
   - Form submission
   - Success → Redirect to dashboard
   - Error → Toast notification with error message

### Sign-Up Page (`/auth/signup`)

1. **User lands on sign-up page**
   - Split-screen layout with form on left, content on right
   - Shows platform benefits and features

2. **Authentication Options**:
   - **Full Registration Form**: Name, email, password, confirm password with real-time validation
   - **"Continue with Google" Button**: One-click Google registration

3. **Google Authentication Flow**:
   - User clicks "Continue with Google" button
   - Redirected to Google OAuth consent screen
   - User grants permissions
   - Account automatically created
   - Success toast notification
   - Redirected to dashboard

4. **Email/Password Flow**:
   - User fills out registration form
   - Real-time field validation
   - Form submission
   - Firebase account creation
   - Email verification sent (non-blocking)
   - Database user record created
   - Redirect to sign-in page with success message

---

## Security Features

### 1. OAuth 2.0 Security

- **Authorization Code Flow**: Uses secure OAuth 2.0 authorization code flow
- **Secure Token Exchange**: Tokens exchanged server-side, never exposed to client
- **HTTPS Enforcement**: All OAuth flows use HTTPS in production

### 2. Session Security

- **HTTP-Only Cookies**: Session tokens stored in HTTP-only cookies (not accessible via JavaScript)
- **Secure Cookies**: Cookies marked as secure in production (HTTPS only)
- **SameSite Protection**: Cookies use 'lax' SameSite policy to prevent CSRF attacks

### 3. Account Protection

- **Email-Based Linking**: Accounts linked by email to prevent duplicates
- **Unique Identifiers**: Each user has unique `firebase_uid` regardless of auth method
- **Provider Tracking**: System tracks which provider was used for authentication

### 4. Error Handling

- **No Sensitive Data**: Error messages don't expose sensitive information
- **Detailed Logging**: Server-side logging for security monitoring
- **User-Friendly Messages**: Clear error messages without technical details

---

## Benefits

### 1. Faster Onboarding

- **One-Click Registration**: Users can create accounts with a single click
- **No Password Required**: Google users don't need to create or remember passwords
- **Pre-filled Data**: Profile information automatically populated from Google

### 2. Reduced Friction

- **No Password Management**: Users don't need to create, remember, or reset passwords
- **Familiar Flow**: Google authentication is familiar to most users
- **Automatic Account Creation**: No manual form filling required

### 3. Better User Experience

- **Consistent Experience**: Same session system for all authentication methods
- **Visual Feedback**: Clear loading states and success/error messages
- **Smart Redirects**: Users redirected to their intended destination

### 4. Enhanced Security

- **Google Account Security**: Leverages Google's robust security infrastructure
- **OAuth 2.0 Standard**: Industry-standard authentication protocol
- **No Password Storage**: Google users' passwords never stored in our system

---

## Edge Cases Handled

### 1. Existing User with Google

**Scenario**: User has account with email/password, then signs in with Google using same email

**Handling**: 
- System detects existing user by email
- Links Google account to existing account
- Preserves existing user data and `firebase_uid`

### 2. New User with Google

**Scenario**: User signs in with Google for the first time

**Handling**:
- System detects no existing account
- Automatically creates new user record
- Uses Google profile data (name, email, photo)
- Sets `auth_provider` to 'google'

### 3. Missing Email from Google

**Scenario**: Google OAuth doesn't return email (rare edge case)

**Handling**:
- System rejects authentication
- Returns error to user
- Logs error for debugging

### 4. Database Creation Failure

**Scenario**: User authenticates with Google but database insert fails

**Handling**:
- Error logged but doesn't block authentication
- User can still authenticate
- Recommended: Implement retry mechanism or queue for later processing

### 5. Network Errors

**Scenario**: Network failure during OAuth flow or database operations

**Handling**:
- Toast notifications inform user of errors
- Graceful error handling prevents app crashes
- User can retry authentication

### 6. Account Already Exists (Email/Password)

**Scenario**: User tries to sign up with email that already exists

**Handling**:
- Firebase throws `auth/email-already-in-use` error
- User-friendly error message displayed
- Suggests signing in instead

---

## Future Enhancements

### 1. Additional OAuth Providers

- **Facebook OAuth**: Add Facebook as authentication option
- **Apple Sign-In**: Implement Apple ID authentication
- **GitHub OAuth**: Add GitHub for developer-focused users

### 2. Account Management

- **Link/Unlink Providers**: Allow users to connect/disconnect multiple auth providers
- **View Connected Accounts**: Show which providers are linked to user account
- **Primary Provider**: Allow users to set primary authentication method

### 3. Enhanced Profile Sync

- **Periodic Profile Updates**: Sync Google profile changes periodically
- **Additional Google Data**: Sync more profile information (location, etc.)
- **Profile Merge**: Merge data from multiple providers

### 4. Multi-Factor Authentication

- **2FA for Google Accounts**: Support Google's 2FA
- **Backup Codes**: Generate backup codes for account recovery
- **SMS/Email Verification**: Additional verification methods

### 5. Advanced Session Management

- **Device Management**: Show and manage active sessions
- **Remote Logout**: Log out from other devices
- **Session History**: Track login history

### 6. Security Enhancements

- **Rate Limiting**: Prevent brute force attacks
- **IP-Based Restrictions**: Optional IP whitelisting
- **Suspicious Activity Detection**: Alert on unusual login patterns

---

## API Reference

### Authentication Endpoints

#### NextAuth Endpoints

- **`/api/auth/signin`**: Sign-in endpoint
- **`/api/auth/signout`**: Sign-out endpoint
- **`/api/auth/callback/google`**: Google OAuth callback
- **`/api/auth/session`**: Get current session

#### User Management Endpoints

- **`POST /api/v1/users/create-user`**: Create new user
- **`GET /api/v1/users/get-user-by-id`**: Get user by Firebase UID
- **`GET /api/v1/users/get-user-by-uuid`**: Get user by UUID
- **`PUT /api/v1/users/update-user`**: Update user information

### Usage Examples

#### Google Sign-In (Client-Side)

```typescript
import { signIn } from 'next-auth/react';

const handleGoogleSignIn = async () => {
  const result = await signIn('google', {
    redirect: false,
    callbackUrl: '/dashboard',
  });
  
  if (result?.ok) {
    router.push('/dashboard');
  }
};
```

#### Email/Password Sign-In (Client-Side)

```typescript
import { useAuth } from '@/context/AuthContext';

const { login } = useAuth();

const handleSignIn = async (email: string, password: string) => {
  const result = await login(email, password, rememberMe);
  
  if (result.success) {
    router.push('/dashboard');
  }
};
```

---

## Troubleshooting

### Common Issues

#### 1. Google OAuth Not Working

**Symptoms**: Redirect to Google but fails to return

**Solutions**:
- Check `NEXT_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_FIREBASE_GOOGLE_CLIENT_SECRET` are set
- Verify Google OAuth credentials are correct
- Check redirect URIs in Google Console match your domain
- Ensure `NEXTAUTH_URL` is set correctly

#### 2. Session Not Persisting

**Symptoms**: User logged out after page refresh

**Solutions**:
- Check `NEXTAUTH_SECRET` is set
- Verify cookie settings (secure, sameSite)
- Check browser cookie settings
- Verify session maxAge configuration

#### 3. Account Linking Not Working

**Symptoms**: New account created instead of linking to existing

**Solutions**:
- Verify email matching logic (case-insensitive)
- Check database query for existing user
- Review `signIn` callback implementation
- Check email format consistency

#### 4. Database User Creation Fails

**Symptoms**: Google auth works but user not in database

**Solutions**:
- Check Hasura connection and permissions
- Verify GraphQL mutation syntax
- Review error logs for database errors
- Check `auth_provider` field constraints

---

## Best Practices

### 1. Environment Variables

- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate secrets regularly
- Use environment variable validation

### 2. Error Handling

- Always provide user-friendly error messages
- Log detailed errors server-side
- Don't expose sensitive information in errors
- Implement retry mechanisms for transient failures

### 3. Security

- Always use HTTPS in production
- Validate all user inputs
- Implement rate limiting
- Monitor for suspicious activity

### 4. User Experience

- Provide clear loading states
- Show success/error feedback
- Support "Remember Me" functionality
- Handle edge cases gracefully

---

## Summary

The Dropiti authentication system provides a **robust, secure, and user-friendly** authentication experience that supports both traditional email/password authentication and modern OAuth 2.0 social authentication. The system features:

- ✅ **One-click Google authentication** for faster onboarding
- ✅ **Automatic account linking** to prevent duplicate accounts
- ✅ **Seamless user experience** across all authentication methods
- ✅ **Secure OAuth 2.0 flow** with proper token handling
- ✅ **Robust error handling** with user-friendly feedback
- ✅ **Unified session management** for consistent experience

This implementation enables users to quickly register and log in while maintaining security and providing a consistent experience across all authentication methods.

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0  
**Maintainer**: Dropiti Development Team

