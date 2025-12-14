import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_USER_DRAFT_REVIEWS } from '@/app/graphql/RestaurantReviews/restaurantReviewQueries';
import { GET_RESTAURANT_BY_UUID } from '@/app/graphql/Restaurants/restaurantQueries';
import { GET_RESTAURANT_USER_BY_ID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin(): boolean {
  if (getApps().length > 0) {
    return true;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      return false;
    }
    
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    const isInitialized = initializeFirebaseAdmin();
    if (!isInitialized) {
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    const auth = getAuth();
    let firebaseUid: string | null = null;

    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
      } catch (error) {
        console.error('Failed to verify ID token:', error);
      }
    }

    // If no Authorization header, try session cookie
    if (!firebaseUid) {
      const sessionCookie = request.cookies.get('__session')?.value;
      if (sessionCookie) {
        try {
          const decodedToken = await auth.verifySessionCookie(sessionCookie);
          firebaseUid = decodedToken.uid;
        } catch (error) {
          console.error('Failed to verify session cookie:', error);
        }
      }
    }

    // If still no Firebase UID, user is not authenticated
    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user UUID from Hasura using firebase_uuid
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const userApiUrl = `${baseUrl}/api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid=${encodeURIComponent(firebaseUid)}`;
    
    const userResponse = await fetch(userApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      if (userResponse.status === 404) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      throw new Error(errorData.error || `Failed to fetch user: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    if (!userData.success || !userData.data?.id) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const author_id = userData.data.id;

    if (!UUID_REGEX.test(author_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid author ID format. Expected UUID.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await hasuraQuery(GET_USER_DRAFT_REVIEWS, {
      authorId: author_id,
      limit: Math.min(limit, 100), // Cap at 100
      offset
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to fetch draft reviews',
          details: result.errors
        },
        { status: 500 }
      );
    }

    let reviews = result.data?.restaurant_reviews || [];
    const total = result.data?.restaurant_reviews_aggregate?.aggregate?.count || 0;

    // Get unique restaurant UUIDs
    const restaurantUuids = [...new Set(reviews.map((r: any) => r.restaurant_uuid).filter(Boolean))];

    // Fetch all restaurants in parallel
    const restaurantPromises = restaurantUuids.map(async (uuid: string) => {
      try {
        const restaurantResult = await hasuraQuery(GET_RESTAURANT_BY_UUID, {
          uuid
        });

        if (!restaurantResult.errors && restaurantResult.data?.restaurants_by_pk) {
          const restaurant = restaurantResult.data.restaurants_by_pk;
          return {
            uuid,
            restaurant: {
              uuid: restaurant.uuid,
              id: restaurant.id,
              title: restaurant.title || '',
              slug: restaurant.slug || '',
              featured_image_url: restaurant.featured_image_url || ''
            }
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch restaurant ${uuid}:`, error);
      }
      return null;
    });

    const restaurantResults = await Promise.all(restaurantPromises);
    const restaurantMap = new Map(
      restaurantResults
        .filter(Boolean)
        .map((result: any) => [result.uuid, result.restaurant])
    );

    // Fetch author data (all reviews have the same author_id)
    let authorData = null;
    try {
      const authorResult = await hasuraQuery(GET_RESTAURANT_USER_BY_ID, {
        id: author_id
      });

      if (!authorResult.errors && authorResult.data?.restaurant_users_by_pk) {
        const user = authorResult.data.restaurant_users_by_pk;
        authorData = {
          id: user.id,
          username: user.username || '',
          display_name: user.display_name || user.username || '',
          profile_image: user.profile_image
        };
      }
    } catch (error) {
      console.warn('Failed to fetch author data:', error);
    }

    // Attach author and restaurant data to each review
    const reviewsWithData = reviews.map((review: any) => ({
      ...review,
      author: authorData || {
        id: author_id,
        username: '',
        display_name: '',
        profile_image: null
      },
      restaurant: restaurantMap.get(review.restaurant_uuid) || {
        uuid: review.restaurant_uuid || '',
        id: null,
        title: '',
        slug: '',
        featured_image_url: ''
      }
    }));

    return NextResponse.json({
      success: true,
      data: reviewsWithData,
      meta: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Get Draft Reviews API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
