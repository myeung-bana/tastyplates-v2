import { NextRequest, NextResponse } from 'next/server';
import { verifyNhostToken } from '@/lib/nhost-server-auth';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

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

// GraphQL query to get suggested users (top reviewers with most followers)
const GET_SUGGESTED_USERS = `
  query GetSuggestedUsers($limit: Int!, $excludeUserId: uuid) {
    restaurant_users(
      where: { 
        _and: [
          { id: { _neq: $excludeUserId } }
          { review_count: { _gt: 0 } }
        ]
      }
      order_by: [
        { follower_count: desc_nulls_last }
        { review_count: desc }
      ]
      limit: $limit
    ) {
      id
      username
      display_name
      profile_image
      review_count
      follower_count
      about_me
    }
  }
`;

interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  profile_image?: any;
  review_count: number;
  follower_count: number;
  about_me?: string;
}

interface HasuraResponse {
  data?: {
    restaurant_users: SuggestedUser[];
  };
  errors?: Array<{ message: string }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    // Get the current user's ID from Nhost token
    const authHeader = request.headers.get('Authorization');
    let currentUserId: string | null = null;

    if (authHeader) {
      try {
        const tokenResult = await verifyNhostToken(authHeader);
        if (tokenResult.success) {
          currentUserId = tokenResult.userId!;
        }
      } catch (error) {
        console.error('Error verifying Nhost token:', error);
        // Continue without excluding the current user
      }
    }

    // Get version for suggested users
    const version = await getVersion('v:users:suggested');
    
    // Cache key with limit and version
    const cacheKey = `users:suggested:v${version}:limit=${limit}:exclude=${currentUserId || 'none'}`;
    
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      600, // 600 seconds (10 minutes) TTL - suggested users don't change frequently
      async () => {
        // Fetch suggested users from Hasura
        const result = await hasuraQuery<HasuraResponse['data']>(
          GET_SUGGESTED_USERS,
          {
            limit,
            excludeUserId: currentUserId
          }
        );

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          throw new Error(result.errors[0]?.message || 'Failed to fetch suggested users');
        }

        const suggestedUsers = result.data?.restaurant_users || [];

        // Format the response
        const formattedUsers = suggestedUsers.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.username,
          avatar: getProfileImageUrl(user.profile_image),
          reviewCount: user.review_count || 0,
          followerCount: user.follower_count || 0,
          bio: user.about_me || null
        }));

        return {
          success: true,
          data: {
            users: formattedUsers,
            total: formattedUsers.length
          }
        };
      }
    );
    
    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': hit ? 'HIT' : 'MISS',
        'X-Cache-Key': cacheKey,
        // HTTP caching for CDN and browsers (10 minutes, stale-while-revalidate for 20 minutes)
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'CDN-Cache-Control': 'public, s-maxage=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600'
      }
    });

  } catch (error) {
    console.error('Error in suggested users endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

