import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { CREATE_RESTAURANT } from '@/app/graphql/Restaurants/restaurantQueries';
import { formatAddressComponents } from '@/lib/google-places-utils';

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * POST /api/v1/restaurants-v2/create-restaurant
 * 
 * Create a new restaurant from Google Places data.
 * Restaurant is created with status 'draft' or 'pending' for admin review.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      place_id,
      formatted_address,
      address_components,
      latitude,
      longitude,
      phone,
      website,
      featured_image_url, // Base64 data URL or S3 URL
      uploaded_images, // Array of base64 data URLs or S3 URLs
      status = 'draft', // Default to 'draft' for user-created restaurants
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Restaurant name (title) is required' },
        { status: 400 }
      );
    }

    if (!place_id) {
      return NextResponse.json(
        { success: false, error: 'Google Place ID is required' },
        { status: 400 }
      );
    }

    // Format address components
    let address = {};
    if (address_components && Array.isArray(address_components)) {
      address = formatAddressComponents(address_components);
      // Add place_id to address
      address.place_id = place_id;
    } else if (formatted_address) {
      // Fallback: use formatted address if components not available
      address = {
        streetAddress: formatted_address,
        place_id: place_id,
      };
    } else {
      address = {
        place_id: place_id,
      };
    }

    // Generate slug from title
    const slug = generateSlug(title);

    // Build restaurant object
    const restaurantObject: any = {
      title,
      slug,
      status,
      listing_street: formatted_address || (address as any).streetAddress || '',
      phone: phone || null,
      menu_url: website || null,
      address,
      ...(latitude !== undefined && latitude !== null && { latitude: parseFloat(latitude.toString()) }),
      ...(longitude !== undefined && longitude !== null && { longitude: parseFloat(longitude.toString()) }),
      ...(featured_image_url && { featured_image_url }), // Add featured image if provided
      ...(uploaded_images && Array.isArray(uploaded_images) && uploaded_images.length > 0 && { uploaded_images }), // Add image gallery if provided
    };

    // Execute mutation
    const result = await hasuraMutation(CREATE_RESTAURANT, {
      object: restaurantObject,
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to create restaurant',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    const createdRestaurant = result.data?.insert_restaurants_one;

    if (!createdRestaurant) {
      return NextResponse.json(
        { success: false, error: 'Failed to create restaurant - no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: createdRestaurant,
    }, { status: 201 });

  } catch (error) {
    console.error('Create Restaurant API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
