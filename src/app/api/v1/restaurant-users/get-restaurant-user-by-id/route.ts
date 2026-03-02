import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_PROFILE_BY_ID } from '@/app/graphql/UserProfiles/userProfilesQueries';

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

    // Query Nhost user_profiles only
    console.log('[getUserById] Querying user_profiles table for user_id:', id);
    const result = await hasuraQuery(GET_USER_PROFILE_BY_ID, { user_id: id });
    
    const userProfile = result.data?.user_profiles?.[0] ?? null;
    
    if (!userProfile || !userProfile.user) {
      console.log('[getUserById] User not found in user_profiles');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[getUserById] Found user in user_profiles table:', {
      user_id: id,
      username: userProfile.username,
      has_auth_user: !!userProfile.user
    });

    // Transform Nhost schema to RestaurantUser format for backward compatibility
    const { user, ...profileData } = userProfile;
    
    const transformedUser = {
      id: user.id,
      firebase_uuid: user.id, // Use Nhost user ID as firebase_uuid for compatibility
      username: profileData.username,
      email: user.email,
      display_name: user.displayName || profileData.username,
      user_nicename: profileData.username,
      is_google_user: user.metadata?.provider === 'google' || false,
      google_auth: user.metadata?.provider === 'google' || false,
      auth_method: user.metadata?.provider || 'password',
      profile_image: user.avatarUrl ? { url: user.avatarUrl } : null,
      about_me: profileData.about_me,
      birthdate: profileData.birthdate,
      gender: profileData.gender,
      pronoun: profileData.pronoun,
      palates: profileData.palates,
      language_preference: user.locale || 'en',
      onboarding_complete: profileData.onboarding_complete || false,
      created_at: profileData.created_at || user.createdAt,
      updated_at: profileData.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...transformedUser,
        followers_count: 0, // TODO: Implement followers count for Nhost
        following_count: 0  // TODO: Implement following count for Nhost
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

