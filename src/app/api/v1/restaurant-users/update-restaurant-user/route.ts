import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { UPDATE_RESTAURANT_USER } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

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

    // Build changes object with only provided fields
    const changes: any = {};
    
    if (updateFields.username !== undefined) changes.username = updateFields.username;
    if (updateFields.email !== undefined) changes.email = updateFields.email;
    if (updateFields.display_name !== undefined) changes.display_name = updateFields.display_name;
    if (updateFields.user_nicename !== undefined) changes.user_nicename = updateFields.user_nicename;
    if (updateFields.password_hash !== undefined) changes.password_hash = updateFields.password_hash;
    if (updateFields.is_google_user !== undefined) changes.is_google_user = updateFields.is_google_user;
    if (updateFields.google_auth !== undefined) changes.google_auth = updateFields.google_auth;
    if (updateFields.google_token !== undefined) changes.google_token = updateFields.google_token;
    if (updateFields.auth_method !== undefined) changes.auth_method = updateFields.auth_method;
    if (updateFields.profile_image !== undefined) changes.profile_image = updateFields.profile_image;
    if (updateFields.about_me !== undefined) changes.about_me = updateFields.about_me;
    if (updateFields.birthdate !== undefined) changes.birthdate = updateFields.birthdate;
    if (updateFields.gender !== undefined) changes.gender = updateFields.gender;
    if (updateFields.custom_gender !== undefined) changes.custom_gender = updateFields.custom_gender;
    if (updateFields.pronoun !== undefined) changes.pronoun = updateFields.pronoun;
    if (updateFields.address !== undefined) changes.address = updateFields.address;
    if (updateFields.zip_code !== undefined) changes.zip_code = updateFields.zip_code;
    if (updateFields.latitude !== undefined) changes.latitude = updateFields.latitude;
    if (updateFields.longitude !== undefined) changes.longitude = updateFields.longitude;
    if (updateFields.palates !== undefined) changes.palates = updateFields.palates;
    if (updateFields.language_preference !== undefined) changes.language_preference = updateFields.language_preference;
    if (updateFields.onboarding_complete !== undefined) changes.onboarding_complete = updateFields.onboarding_complete;

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const result = await hasuraMutation(UPDATE_RESTAURANT_USER, {
      id,
      changes
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to update user',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const user = result.data?.update_restaurant_users_by_pk;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

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

