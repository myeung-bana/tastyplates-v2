import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_FOLLOWERS_LIST } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper function to extract profile image URL from JSONB format
const getProfileImageUrl = (profileImage: any): string | null => {
  if (!profileImage) return null;
  
  if (typeof profileImage === 'string') {
    return profileImage;
  }
  
  if (typeof profileImage === 'object') {
    return profileImage.url || profileImage.thumbnail || profileImage.medium || profileImage.large || null;
  }
  
  return null;
};

// Helper function to extract palates array from JSONB format
const getPalatesArray = (palates: any): string[] => {
  if (!palates) return [];
  
  if (Array.isArray(palates)) {
    return palates.map((palate: any) => {
      if (typeof palate === 'string') {
        return palate;
      }
      if (typeof palate === 'object' && palate !== null) {
        return palate.name || palate.slug || String(palate);
      }
      return String(palate);
    });
  }
  
  if (typeof palates === 'string') {
    return palates.split(/[|,]\s*/).filter((p: string) => p.trim().length > 0);
  }
  
  return [];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid user ID format. Expected UUID, got: "${userId}"` 
        },
        { status: 400 }
      );
    }

    // Get pagination parameters
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await hasuraQuery(GET_FOLLOWERS_LIST, { 
      userId,
      limit,
      offset
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      // Check if error is about missing table or relationship
      const hasTableError = result.errors.some((err: any) => 
        err.message?.includes('restaurant_user_follows') || 
        err.message?.includes('not found') ||
        err.message?.includes('relationship')
      );
      
      if (hasTableError) {
        // Return empty array if table doesn't exist (table might not be set up yet)
        return NextResponse.json({
          success: true,
          data: []
        });
      }
      
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Operation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    // Transform to match Follower interface expected by modals
    const followersList = result.data?.restaurant_user_follows || [];
    const followers = followersList.map((follow: any) => {
      const follower = follow.follower;
      return {
        id: follower.id,
        username: follower.username, // Include username for profile URLs
        name: follower.display_name || follower.username,
        cuisines: getPalatesArray(follower.palates),
        image: getProfileImageUrl(follower.profile_image),
        isFollowing: false // Will be determined by checking current user's following list if needed
      };
    });

    return NextResponse.json({
      success: true,
      data: followers
    });

  } catch (error) {
    console.error('Get Followers List API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

