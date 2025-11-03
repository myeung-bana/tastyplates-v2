import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

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

// Create auth middleware with CORS support
const authMiddleware = withAuth(
  function authMiddleware(req) {
    // Allow public access to user profiles (routes like /profile/[userId])
    if (req.nextUrl.pathname.startsWith('/profile/') && 
        req.nextUrl.pathname !== '/profile' && 
        req.nextUrl.pathname !== '/profile/edit') {
      const response = NextResponse.next();
      return addCorsHeaders(response);
    }
    
    // For all other protected routes, require authentication
    if (!req.nextauth.token) {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }
    
    const response = NextResponse.next();
    return addCorsHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Skip auth for API routes (they handle their own auth and OPTIONS)
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }
        
        // Allow public access to user profiles
        if (req.nextUrl.pathname.startsWith('/profile/') && 
            req.nextUrl.pathname !== '/profile' && 
            req.nextUrl.pathname !== '/profile/edit') {
          return true;
        }
        // Require authentication for other routes
        return !!token;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

// Wrap to handle OPTIONS before auth middleware
export default function middleware(request: NextRequest) {
  // Handle OPTIONS requests for CORS preflight (must be before auth)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // For API routes, add CORS and skip auth
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    return addCorsHeaders(response);
  }

  // For protected routes, use auth middleware
  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/settings",
    "/profile",
    "/profile/edit",
    "/profile/:userId*",
    "/dashboard/:path*",
  ],
};
