import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow public access to user profiles (routes like /profile/[userId])
    if (req.nextUrl.pathname.startsWith('/profile/') && req.nextUrl.pathname !== '/profile' && req.nextUrl.pathname !== '/profile/edit') {
      return NextResponse.next();
    }
    
    // For all other protected routes, require authentication
    if (!req.nextauth.token) {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public access to user profiles
        if (req.nextUrl.pathname.startsWith('/profile/') && req.nextUrl.pathname !== '/profile' && req.nextUrl.pathname !== '/profile/edit') {
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

export const config = {
  matcher: ["/settings", "/profile", "/profile/edit", "/profile/:userId*", "/dashboard/:path*"],
};
