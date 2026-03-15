import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_PROFILE_BY_USERNAME } from '@/app/graphql/UserProfiles/userProfilesQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format (basic check - alphanumeric, underscore, hyphen, dots)
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid username format. Username can only contain letters, numbers, dots, underscores, and hyphens.` 
        },
        { status: 400 }
      );
    }

    // Query user by username from user_profiles table (Nhost)
    const result = await hasuraQuery(GET_USER_PROFILE_BY_USERNAME, { username });

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

    const profiles = result.data?.user_profiles || [];
    const profile = profiles[0];

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build response combining user_profiles + auth.users data
    const userData = {
      // Use user_id as the primary identifier (UUID)
      id: profile.user_id,
      user_id: profile.user_id,
      
      // From user_profiles table
      username: profile.username,
      about_me: profile.about_me,
      birthdate: profile.birthdate,
      gender: profile.gender,
      palates: profile.palates,
      onboarding_complete: profile.onboarding_complete,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      
      // From auth.users table (via relationship)
      email: profile.user?.email,
      display_name: profile.username,
      displayName: profile.username,
      avatarUrl: profile.user?.avatarUrl,
      profile_image: profile.user?.avatarUrl, // Compatibility mapping
      emailVerified: profile.user?.emailVerified,
      phoneNumber: profile.user?.phoneNumber,
      locale: profile.user?.locale,
      metadata: profile.user?.metadata,
      
      // Follower/following counts (TODO: implement proper counts from relationships table)
      followers_count: 0,
      following_count: 0
    };

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Get Restaurant User by Username API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
