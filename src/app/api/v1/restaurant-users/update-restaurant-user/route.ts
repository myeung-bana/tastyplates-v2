import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation, hasuraQuery } from '@/app/graphql/hasura-server-client';
import { UPDATE_USER_PROFILE, UPDATE_USER_AVATAR, UPDATE_USER_LOCALE, GET_USER_PROFILE_BY_ID } from '@/app/graphql/UserProfiles/userProfilesQueries';

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
    const userProfile = checkResult.data?.user_profiles?.[0];
    
    if (!userProfile) {
      console.log('[updateUser] User not found in user_profiles');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[updateUser] User found in user_profiles - updating');

    // Update auth.users.avatarUrl only when we have a proper URL (never base64 or invalid)
    let avatarUrlToSet: string | null = null;
    if (typeof updateFields.profile_image === 'string' && updateFields.profile_image.startsWith('http')) {
      avatarUrlToSet = updateFields.profile_image;
    } else if (
      updateFields.profile_image &&
      typeof updateFields.profile_image === 'object' &&
      typeof (updateFields.profile_image as { url?: string }).url === 'string' &&
      (updateFields.profile_image as { url: string }).url.startsWith('http')
    ) {
      avatarUrlToSet = (updateFields.profile_image as { url: string }).url;
    }
    if (avatarUrlToSet) {
      const avatarResult = await hasuraMutation(UPDATE_USER_AVATAR, {
        userId: id,
        avatarUrl: avatarUrlToSet,
      });
      if (avatarResult.errors) {
        console.error('[updateUser] Failed to update avatarUrl:', avatarResult.errors);
      } else {
        console.log('[updateUser] avatarUrl updated in auth.users');
      }
    }

    // Update auth.users.locale when language_preference is sent (MVP: en, zh, ko; default 'en')
    const allowedLocaleCodes = ['en', 'zh', 'ko'];
    if (updateFields.language_preference !== undefined) {
      const locale = allowedLocaleCodes.includes(updateFields.language_preference)
        ? updateFields.language_preference
        : 'en';
      const localeResult = await hasuraMutation(UPDATE_USER_LOCALE, { userId: id, locale });
      if (localeResult.errors) {
        console.error('[updateUser] Failed to update locale:', localeResult.errors);
      } else {
        console.log('[updateUser] locale updated in auth.users');
      }
    }

    // Update user_profiles table (profile_image lives in auth.users, not here)
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
    // profile_image is intentionally excluded — avatar is stored in auth.users.avatarUrl
    
    // Add updated_at timestamp
    profileChanges.updated_at = new Date().toISOString();

    const hasProfileChanges = Object.keys(profileChanges).some(k => k !== 'updated_at');
    const hasAuthOnlyChanges = !!avatarUrlToSet || updateFields.language_preference !== undefined;
    if (!hasProfileChanges && !updateFields.profile_image && !hasAuthOnlyChanges) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // If only avatar and/or locale changed (no user_profiles fields), return early after auth updates
    if (!hasProfileChanges && (updateFields.profile_image || updateFields.language_preference !== undefined)) {
      const userResult = await hasuraQuery(GET_USER_PROFILE_BY_ID, { user_id: id });
      const avatarOnlyProfile = userResult.data?.user_profiles?.[0];
      if (avatarOnlyProfile?.user) {
        const { user: authUser, ...profileData } = avatarOnlyProfile;
        return NextResponse.json({
          success: true,
          data: {
            id: authUser.id,
            firebase_uuid: authUser.id,
            username: profileData.username,
            email: authUser.email,
            display_name: profileData.username,
            about_me: profileData.about_me,
            birthdate: profileData.birthdate,
            gender: profileData.gender,
            pronoun: profileData.pronoun,
            palates: profileData.palates,
            onboarding_complete: profileData.onboarding_complete,
            updated_at: profileData.updated_at,
          }
        });
      }
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

    const updatedProfile = result.data?.update_user_profiles?.returning?.[0];

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Fetch complete user data after update
    const userResult = await hasuraQuery(GET_USER_PROFILE_BY_ID, { user_id: id });
    const finalUserProfile = userResult.data?.user_profiles?.[0];

    if (finalUserProfile && finalUserProfile.user) {
      const { user, ...profileData } = finalUserProfile;
      
      // Transform to RestaurantUser format
      const transformedUser = {
        id: user.id,
        firebase_uuid: user.id,
        username: profileData.username,
        email: user.email,
        display_name: profileData.username,
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

