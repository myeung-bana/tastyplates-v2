import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_RESTAURANT_USER_BY_FIREBASE_UUID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let firebase_uuid = searchParams.get('firebase_uuid');

    // If firebase_uuid is not provided as query parameter, try to extract it from the Authorization token
    if (!firebase_uuid) {
      try {
        const auth = getFirebaseAdmin().auth();
        const authHeader = request.headers.get('authorization');
        
        if (authHeader?.startsWith('Bearer ')) {
          const idToken = authHeader.split('Bearer ')[1];
          try {
            const decodedToken = await auth.verifyIdToken(idToken);
            firebase_uuid = decodedToken.uid;
          } catch (error) {
            console.error('Failed to verify ID token:', error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Firebase Admin or extract Firebase UUID:', error);
      }
    }

    if (!firebase_uuid) {
      return NextResponse.json(
        { success: false, error: 'Firebase UUID is required. Provide it as a query parameter or in the Authorization header.' },
        { status: 400 }
      );
    }

    const result = await hasuraQuery(GET_RESTAURANT_USER_BY_FIREBASE_UUID, { firebase_uuid });

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

    const users = result.data?.restaurant_users || [];
    const user = users[0];

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
    console.error('Get Restaurant User by Firebase UUID API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

