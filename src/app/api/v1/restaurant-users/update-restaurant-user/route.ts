import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation, hasuraQuery } from '@/app/graphql/hasura-server-client';
import { UPDATE_USER_PROFILE, GET_USER_PROFILE_BY_ID } from '@/app/graphql/UserProfiles/userProfilesQueries';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists in user_profiles
    console.log('[updateUser] Checking if user exists in user_profiles for user_id:', id);
    const checkResult = await hasuraQuery(GET_USER_PROFILE_BY_ID, { user_id: id });
    const userProfile = checkResult.data?.user_profiles_by_pk;
    
    if (!userProfile) {
      console.log('[updateUser] User not found in user_profiles');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[updateUser] User found in user_profiles - updating');
    
    // Update user_profiles table
    console.log('[updateUser] Updating Nhost user_profiles');
      
    // Build changes object with only user_profiles fields
    const profileChanges: any = {};
    
    if (updateFields.username !== undefined) profileChanges.username = updateFields.username;
    if (updateFields.about_me !== undefined) profileChanges.about_me = updateFields.about_me;
    if (updateFields.birthdate !== undefined) profileChanges.birthdate = updateFields.birthdate;
    if (updateFields.gender !== undefined) profileChanges.gender = updateFields.gender;
    if (updateFields.pronoun !== undefined) profileChanges.pronoun = updateFields.pronoun;
    if (updateFields.palates !== undefined) profileChanges.palates = updateFields.palates;
    if (updateFields.onboarding_complete !== undefined) profileChanges.onboarding_complete = updateFields.onboarding_complete;
    
    // Add updated_at timestamp
    profileChanges.updated_at = new Date().toISOString();

    if (Object.keys(profileChanges).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No user_profiles fields to update' },
        { status: 400 }
      );
    }

    const result = await hasuraMutation(UPDATE_USER_PROFILE, {
      user_id: id,
      changes: profileChanges
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to update user profile',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const updatedProfile = result.data?.update_user_profiles_by_pk;

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Fetch complete user data after update
    const userResult = await hasuraQuery(GET_USER_PROFILE_BY_ID, { user_id: id });
    const finalUserProfile = userResult.data?.user_profiles_by_pk;

    if (finalUserProfile && finalUserProfile.user) {
      const { user, ...profileData } = finalUserProfile;
      
      // Transform to RestaurantUser format
      const transformedUser = {
        id: user.id,
        firebase_uuid: user.id,
        username: profileData.username,
        email: user.email,
        display_name: user.displayName || profileData.username,
        about_me: profileData.about_me,
        birthdate: profileData.birthdate,
        gender: profileData.gender,
        pronoun: profileData.pronoun,
        palates: profileData.palates,
        onboarding_complete: profileData.onboarding_complete,
        updated_at: profileData.updated_at,
      };

      return NextResponse.json({
        success: true,
        data: transformedUser
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch updated user data' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Update Restaurant User API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

