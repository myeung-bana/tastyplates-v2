import { NextResponse, type NextRequest } from 'next/server'

/**
 * Marks /uptime so the root layout can skip NhostProvider and other auth-heavy
 * client providers — avoids POST /v1/token refresh when monitoring or viewing status.
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tp-minimal-layout', '1')
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/uptime', '/uptime/:path*'],
}
