import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (!req.nextauth.token) {
      let loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: ["/settings", "/profile", "/profile/edit", "/dashboard/:path*"],
};
