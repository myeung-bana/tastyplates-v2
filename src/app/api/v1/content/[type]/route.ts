import { NextRequest, NextResponse } from 'next/server';
import { loadMarkdownContent } from '@/utils/markdownLoader';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;

    // Map content types to filenames
    const filenameMap: Record<string, string> = {
      'terms-of-service': 'terms-of-service',
      'privacy-policy': 'privacy-policy',
      'content-guidelines': 'content-guidelines'
    };

    const filename = filenameMap[type];
    
    if (!filename) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid content type',
          message: `Content type "${type}" not found. Valid types: ${Object.keys(filenameMap).join(', ')}`
        },
        { status: 404 }
      );
    }

    // Load the markdown content
    const content = await loadMarkdownContent(filename);

    return NextResponse.json({
      success: true,
      data: {
        id: filename,
        title: content.title,
        content: content.content,
        date: content.lastUpdated,
        modified: content.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error serving markdown content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load content',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

