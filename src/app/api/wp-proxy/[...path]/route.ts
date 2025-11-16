import { NextRequest, NextResponse } from 'next/server';

const WP_API_BASE = process.env.NEXT_PUBLIC_WP_API_URL;

function createCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

async function forward(request: NextRequest, pathSegments: string[]) {
  if (!WP_API_BASE) {
    return NextResponse.json({ error: 'WP API base URL not configured' }, { status: 500 });
  }

  const path = '/' + pathSegments.join('/');
  const targetUrl = `${WP_API_BASE}${path}`;

  // Clone headers and forward relevant ones
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  if (contentType) headers.set('Content-Type', contentType);
  if (authorization) headers.set('Authorization', authorization);

  // Forward the body if present
  const method = request.method;
  const body = method !== 'GET' && method !== 'HEAD' ? await request.arrayBuffer() : undefined;

  const resp = await fetch(targetUrl, {
    method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const text = await resp.text();

  const nextRes = new NextResponse(text, {
    status: resp.status,
    statusText: resp.statusText,
  });

  // copy select headers from upstream
  resp.headers.forEach((value, key) => {
    try {
      nextRes.headers.set(key, value);
    } catch (e) {
      // ignore invalid header copies
    }
  });

  return createCorsHeaders(nextRes);
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
  return createCorsHeaders(res);
}
