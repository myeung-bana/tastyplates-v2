import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { CREATE_RESTAURANT_USER } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firebase_uuid,
      username,
      email,
      display_name,
      password_hash,
      is_google_user,
      google_auth,
      google_token,
      auth_method,
      profile_image,
      about_me,
      birthdate,
      gender,
      pronoun,
      address,
      zip_code,
      latitude,
      longitude,
      palates,
      language_preference,
      user_nicename
    } = body;

    // Validation
    if (!firebase_uuid) {
      return NextResponse.json(
        { success: false, error: 'Firebase UUID is required' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Build user object with only provided fields
    const userObject: any = {
      firebase_uuid,
      username,
      email,
      ...(display_name && { display_name }),
      ...(password_hash && { password_hash }),
      ...(is_google_user !== undefined && { is_google_user }),
      ...(google_auth !== undefined && { google_auth }),
      ...(google_token && { google_token }),
      ...(auth_method && { auth_method }),
      ...(profile_image && { profile_image }),
      ...(about_me && { about_me }),
      ...(birthdate && { birthdate }),
      ...(gender && { gender }),
      ...(pronoun && { pronoun }),
      ...(address && { address }),
      ...(zip_code && { zip_code }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(palates && { palates }),
      ...(language_preference && { language_preference }),
      ...(user_nicename && { user_nicename })
    };

    const result = await hasuraMutation(CREATE_RESTAURANT_USER, {
      object: userObject
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to create user',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const user = result.data?.insert_restaurant_users_one;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user - no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    }, { status: 201 });

  } catch (error) {
    console.error('Create Restaurant User API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

