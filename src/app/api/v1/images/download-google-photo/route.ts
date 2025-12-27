import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/images/download-google-photo
 * 
 * Server-side proxy to download Google Places photos and convert to base64
 * This bypasses CORS restrictions by downloading on the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoUrl } = body;

    if (!photoUrl || typeof photoUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Photo URL is required' },
        { status: 400 }
      );
    }

    // Validate that it's a Google Places photo URL
    if (!photoUrl.includes('maps.googleapis.com') && !photoUrl.includes('googleapis.com')) {
      return NextResponse.json(
        { success: false, error: 'Invalid photo URL. Only Google Places photos are allowed.' },
        { status: 400 }
      );
    }

    try {
      // Fetch the image from Google
      const response = await fetch(photoUrl, {
        headers: {
          'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      // Get the image as a buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Convert to base64
      const base64 = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const base64DataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        success: true,
        data: base64DataUrl,
      });
    } catch (fetchError: any) {
      console.error('Error fetching Google photo:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to download image from Google',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Download Google Photo API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

