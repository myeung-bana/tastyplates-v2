import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_RESTAURANT_USER_BY_ID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

// Fallback query without relationships (in case they don't exist)
const GET_RESTAURANT_USER_BY_ID_FALLBACK = `
  query GetRestaurantUserById($id: uuid!) {
    restaurant_users_by_pk(id: $id) {
      id
      firebase_uuid
      username
      email
      display_name
      user_nicename
      password_hash
      is_google_user
      google_auth
      google_token
      auth_method
      profile_image
      about_me
      birthdate
      gender
      pronoun
      address
      zip_code
      latitude
      longitude
      palates
      language_preference
      onboarding_complete
      created_at
      updated_at
      deleted_at
    }
  }
`;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate that the ID is a valid UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid user ID format. Expected UUID, got: "${id}"` 
        },
        { status: 400 }
      );
    }

    // Try querying with relationships first
    let result = await hasuraQuery(GET_RESTAURANT_USER_BY_ID, { id });
    
    // Check if error is about missing relationships (followers/following)
    const hasRelationshipError = result.errors?.some((err: any) => 
      err.message?.includes('followers') || 
      err.message?.includes('following') ||
      err.message?.includes('not found') ||
      err.message?.includes('Cannot query field')
    );
    
    if (hasRelationshipError) {
      console.warn('Relationships not available, using fallback query without followers/following');
      // If relationships don't exist, use fallback query without them
      result = await hasuraQuery(GET_RESTAURANT_USER_BY_ID_FALLBACK, { id });
    }

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Operation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const user = result.data?.restaurant_users_by_pk;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate follower and following counts from arrays
    // If relationships don't exist, default to 0
    let followersCount = 0;
    let followingCount = 0;
    
    try {
      // Count followers array (users who follow this user)
      if (Array.isArray(user.followers)) {
        followersCount = user.followers.length;
      }
      
      // Count following array (users this user is following)
      if (Array.isArray(user.following)) {
        followingCount = user.following.length;
      }
    } catch (error) {
      // If relationships don't exist, counts remain 0
      console.warn('Could not get follower/following counts, defaulting to 0:', error);
    }

    // Remove relationship arrays from user object before returning (we only need counts)
    const { followers, following, ...userData } = user;

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        followers_count: followersCount,
        following_count: followingCount
      }
    });

  } catch (error) {
    console.error('Get Restaurant User API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

