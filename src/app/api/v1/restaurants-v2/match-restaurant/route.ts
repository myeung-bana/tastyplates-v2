import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import {
  MATCH_RESTAURANT_BY_PLACE_ID,
  MATCH_RESTAURANT_BY_NAME_ADDRESS,
} from '@/app/graphql/Restaurants/restaurantQueries';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * POST /api/v1/restaurants-v2/match-restaurant
 * 
 * Check if a restaurant exists in the database based on Google Places data.
 * Matching priority:
 * 1. Google Place ID (exact match)
 * 2. Name + Address (fuzzy match)
 * 3. Coordinates proximity (within 100m)
 */
export async function POST(request: NextRequest) {
  try {
    const { place_id, name, address, latitude, longitude } = await request.json();

    // Priority 1: Match by Place ID (most reliable)
    if (place_id) {
      try {
        const result = await hasuraQuery(MATCH_RESTAURANT_BY_PLACE_ID, {
          placeId: place_id,
        });

        if (result.data?.restaurants && result.data.restaurants.length > 0) {
          return NextResponse.json({
            match: true,
            restaurant: result.data.restaurants[0],
            matchType: 'place_id',
          });
        }
      } catch (error) {
        console.error('Error matching by place_id:', error);
        // Continue to next matching method
      }
    }

    // Priority 2: Match by Name + Address
    if (name && address) {
      try {
        // Use first part of address for matching (street address)
        const addressPart = address.split(',')[0].trim();
        const namePattern = `%${name}%`;
        const addressPattern = `%${addressPart}%`;

        const result = await hasuraQuery(MATCH_RESTAURANT_BY_NAME_ADDRESS, {
          name: namePattern,
          address: addressPattern,
        });

        if (result.data?.restaurants && result.data.restaurants.length > 0) {
          // Additional similarity check - use the first match
          const bestMatch = result.data.restaurants[0];
          return NextResponse.json({
            match: true,
            restaurant: bestMatch,
            matchType: 'name_address',
          });
        }
      } catch (error) {
        console.error('Error matching by name and address:', error);
        // Continue to next matching method
      }
    }

    // Priority 3: Match by Coordinates (proximity within 100m)
    if (latitude && longitude) {
      try {
        // Get all restaurants with coordinates
        const result = await hasuraQuery(`
          query MatchRestaurantByCoordinates($lat: numeric!, $lng: numeric!) {
            restaurants(
              where: {
                _and: [
                  { latitude: { _is_null: false } }
                  { longitude: { _is_null: false } }
                ]
              }
            ) {
              id
              uuid
              title
              slug
              status
              listing_street
              phone
              menu_url
              longitude
              latitude
              featured_image_url
              average_rating
              ratings_count
              address
            }
          }
        `, {
          lat: latitude,
          lng: longitude,
        });

        if (result.data?.restaurants && result.data.restaurants.length > 0) {
          // Find closest restaurant within 100m (0.1 km)
          let closestRestaurant = null;
          let minDistance = Infinity;

          for (const restaurant of result.data.restaurants) {
            if (restaurant.latitude && restaurant.longitude) {
              const distance = calculateDistance(
                latitude,
                longitude,
                restaurant.latitude,
                restaurant.longitude
              );

              if (distance < 0.1 && distance < minDistance) {
                minDistance = distance;
                closestRestaurant = restaurant;
              }
            }
          }

          if (closestRestaurant) {
            return NextResponse.json({
              match: true,
              restaurant: closestRestaurant,
              matchType: 'coordinates',
            });
          }
        }
      } catch (error) {
        console.error('Error matching by coordinates:', error);
        // Continue to return no match
      }
    }

    // No match found
    return NextResponse.json({
      match: false,
      restaurant: null,
      matchType: null,
    });

  } catch (error) {
    console.error('Match Restaurant API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
