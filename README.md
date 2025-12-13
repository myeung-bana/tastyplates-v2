This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### Development

```bash
$ git clone chronostep@chronostep.git.backlog.com:/INTIME_TRACKER_COMMERCIAL/RADTastyPlates.git    # cloning the repository(if cloning fails, add your ssh public key in the backlog: https://chronostep.backlog.com/EditUserSshKey.action)
$ yarn install # install all packages via yarn
$ cp .env.example .env.local # copy environment variables template
$ # Edit .env.local with your actual Firebase, Hasura, and other credentials
$ yarn dev # start development server
```

## Environment Setup

This application uses **Firebase Authentication** as the primary authentication system (SSO).

### Required Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

#### Firebase Configuration (Client-side)
Get these from [Firebase Console](https://console.firebase.google.com/):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

#### Firebase Admin SDK (Server-side)
Get these from Firebase Console → Project Settings → Service Accounts:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (download service account JSON file)

#### Google OAuth
Get these from [Google Cloud Console](https://console.cloud.google.com/):
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

#### Hasura Configuration
- `NEXT_PUBLIC_HASURA_GRAPHQL_URL`
- `HASURA_GRAPHQL_ADMIN_SECRET`

### Authentication Flow

This application uses **Firebase as SSO** (Single Sign-On):

1. User clicks "Continue with Google" or enters email/password
2. Firebase authenticates the user and creates a session
3. User data is synced with Hasura database
4. Application uses Firebase session for all authenticated requests

**Benefits:**
- ✅ Single authentication system (no dual cookie issues)
- ✅ No HTTP 431 errors from excessive cookies
- ✅ Industry-standard SSO implementation
- ✅ Automatic session management via Firebase
- ✅ Simplified authentication flow

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
