import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK
 * Returns true if initialized successfully, false otherwise
 */
function initializeFirebaseAdmin(): boolean {
  // Check if already initialized
  if (getApps().length > 0) {
    return true;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    // Check for required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('Firebase Admin SDK: FIREBASE_PROJECT_ID is not set');
      return false;
    }
    
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Firebase Admin SDK: FIREBASE_CLIENT_EMAIL is not set');
      return false;
    }
    
    if (!privateKey) {
      console.error('Firebase Admin SDK: FIREBASE_PRIVATE_KEY is not set or invalid');
      return false;
    }
    
    // Initialize Firebase Admin
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return false;
  }
}

// Try to initialize on module load
initializeFirebaseAdmin();

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Helper function to add CORS headers to response
function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Public routes that don't require authentication
 */
function isPublicRoute(pathname: string): boolean {
  const publicPatterns = [
    '/',
    '/content-guidelines',
    '/privacy-policy',
    '/terms-of-service',
    '/hashtag',
    '/restaurants',
    '/listing',
    '/review-listing',
  ];
  
  // Allow public access to specific user profiles (view-only)
  // But NOT to /profile or /profile/edit (those are user's own profile)
  if (pathname.startsWith('/profile/') && 
      pathname !== '/profile' && 
      pathname !== '/profile/edit') {
    return true;
  }
  
  // Check if pathname matches any public pattern
  return publicPatterns.some(pattern => {
    if (pattern === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(pattern);
  });
}

/**
 * Verify Firebase ID token from request
 * Checks both Authorization header and Firebase session cookie
 */
async function verifyFirebaseAuth(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    // Try to initialize Firebase Admin if not already initialized
    const isInitialized = initializeFirebaseAdmin();
    if (!isInitialized) {
      console.warn('Firebase Admin SDK not initialized - authentication will fail');
      return null;
    }

    const auth = getAuth();
    
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
        };
      } catch (error) {
        console.error('Failed to verify ID token:', error);
      }
    }
    
    // Try to get Firebase session cookie
    const sessionCookie = request.cookies.get('__session')?.value;
    if (sessionCookie) {
      try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie);
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
        };
      } catch (error) {
        console.error('Failed to verify session cookie:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Firebase auth verification error:', error);
    return null;
  }
}

/**
 * Main proxy function - replaces NextAuth middleware
 * Uses Firebase Admin SDK for authentication
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Allow all API routes to pass through
  // They will handle their own authentication
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    return addCorsHeaders(response);
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    return addCorsHeaders(response);
  }

  // For protected routes, verify Firebase authentication
  const authResult = await verifyFirebaseAuth(request);
  
  if (!authResult) {
    // Not authenticated - redirect to login
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }
  
  // Authenticated - add user info to headers for API routes to use
  const response = NextResponse.next();
  response.headers.set('x-firebase-uid', authResult.uid);
  if (authResult.email) {
    response.headers.set('x-user-email', authResult.email);
  }
  
  return addCorsHeaders(response);
}

export const config = {
  matcher: [
    // Protected routes that require authentication
    "/settings/:path*",
    "/profile",
    "/profile/edit",
    "/dashboard/:path*",
    "/add-review/:path*", // Legacy route - redirects to /tastystudio/add-review
    "/tastystudio/:path*",
    "/edit-review/:path*",
    "/onboarding/:path*",
    "/following/:path*",
    // API routes for CORS
    "/api/:path*",
  ],
};
