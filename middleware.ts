import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge guard for the landing page. This project has no `/api` routes — every form and chat
 * call goes to the Universal Backend — so we only stamp a request id and reject methods a
 * static site never needs.
 */
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function middleware(request: NextRequest) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return new NextResponse('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD, OPTIONS', 'Cache-Control': 'no-store' },
    });
  }

  const requestId = request.headers.get('x-request-id')?.slice(0, 64) || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('X-Request-ID', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|niches/|favicon.ico).*)'],
};
