/**
 * DEPRECATED ENDPOINT
 * 
 * This endpoint is deprecated and should not be used.
 * It was used to fetch user data by Firebase UUID, which is no longer the authentication method.
 * 
 * Migration Guide:
 * - With Nhost authentication, the user ID is available directly from the JWT token
 * - Use verifyNhostToken() helper to get user ID from token
 * - Use /api/v1/restaurant-users/get-restaurant-user-by-id?id=<user_id> instead
 * - Or query user_profiles table directly via GraphQL
 * 
 * @deprecated Since Nhost migration (Feb 2026)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated. Use /api/v1/restaurant-users/get-restaurant-user-by-id instead.',
      message: 'Firebase UUID lookup is no longer supported. With Nhost authentication, the user ID is available directly from the JWT token. Use verifyNhostToken() helper or query user_profiles table.',
      migration: {
        old: '/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid=<firebase_uid>',
        new: '/api/v1/restaurant-users/get-restaurant-user-by-id?id=<user_id>',
        note: 'User ID is now available directly from Nhost JWT token. No lookup needed.'
      }
    },
    { status: 410 } // 410 Gone - indicates the resource is permanently removed
  );
}

