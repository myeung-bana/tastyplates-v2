import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = new Headers();
    
    // Forward relevant headers from the original request
    const contentType = request.headers.get('content-type');
    const authorization = request.headers.get('authorization');
    
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    if (authorization) {
      headers.set('Authorization', authorization);
    }

    // Make the request to the actual GraphQL endpoint
    const response = await fetch('https://backend.tastyplates.co/graphql', {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.text();
    
    // Create response with proper CORS headers
    const nextResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Add CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    nextResponse.headers.set('Access-Control-Max-Age', '86400');

    return nextResponse;
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
