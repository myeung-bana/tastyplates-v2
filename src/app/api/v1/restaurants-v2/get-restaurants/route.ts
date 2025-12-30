import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_RESTAURANTS } from '@/app/graphql/Restaurants/restaurantQueries';
import { cacheGetOrSetJSON } from '@/lib/redis-cache';
import { getVersion } from '@/lib/redis-versioning';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * GET /api/v1/restaurants-v2/get-restaurants
 * 
 * Fetch restaurants with comprehensive filtering, pagination, and search
 * 
 * Query Parameters:
 * - limit: number (1-1000, default: 100)
 * - offset: number (default: 0)
 * - status: string ('publish', 'draft', 'private', default: 'publish')
 * - search: string (searches title, slug, listing_street)
 * - cuisine_ids: string (comma-separated IDs, e.g., "1,2,3")
 * - palate_ids: string (comma-separated IDs)
 * - category_ids: string (comma-separated IDs)
 * - price_range_id: number
 * - min_rating: number (0-5)
 * - max_rating: number (0-5)
 * - latitude: number
 * - longitude: number
 * - radius_km: number (requires latitude and longitude)
 * - is_main_location: boolean ('true' or 'false')
 * - order_by: string ('rating', 'price', 'created_at', 'updated_at', 'distance')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Basic pagination
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Basic filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Advanced filters
    const cuisineIds = searchParams.get('cuisine_ids');
    const palateIds = searchParams.get('palate_ids');
    const categoryIds = searchParams.get('category_ids');
    const priceRangeId = searchParams.get('price_range_id');
    const minRating = searchParams.get('min_rating');
    const maxRating = searchParams.get('max_rating');
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radiusKm = searchParams.get('radius_km');
    const isMainLocation = searchParams.get('is_main_location');
    const orderBy = searchParams.get('order_by');

    // Validation
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Offset must be 0 or greater' },
        { status: 400 }
      );
    }

    // Build where clause
    const statusFilter = status || 'publish';
    const whereConditions: any[] = [
      { status: { _eq: statusFilter } }
    ];

    // Search filter
    if (search) {
      whereConditions.push({
        _or: [
          { title: { _ilike: `%${search}%` } },
          { slug: { _ilike: `%${search}%` } },
          { listing_street: { _ilike: `%${search}%` } }
        ]
      });
    }

    // Taxonomy filters (cuisine_ids, palate_ids, category_ids)
    // Note: These filter JSONB arrays, so we check if the array contains the ID
    if (cuisineIds) {
      const ids = cuisineIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereConditions.push({
          _or: ids.map(id => ({
            cuisines: { _contains: [{ id }] }
          }))
        });
      }
    }

    if (palateIds) {
      const ids = palateIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereConditions.push({
          _or: ids.map(id => ({
            palates: { _contains: [{ id }] }
          }))
        });
      }
    }

    if (categoryIds) {
      const ids = categoryIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereConditions.push({
          _or: ids.map(id => ({
            categories: { _contains: [{ id }] }
          }))
        });
      }
    }

    // Price range filter
    if (priceRangeId) {
      const priceRangeIdNum = parseInt(priceRangeId);
      if (!isNaN(priceRangeIdNum)) {
        whereConditions.push({ price_range_id: { _eq: priceRangeIdNum } });
      }
    }

    // Rating filters
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      if (!isNaN(minRatingNum) && minRatingNum >= 0 && minRatingNum <= 5) {
        whereConditions.push({ average_rating: { _gte: minRatingNum } });
      }
    }

    if (maxRating) {
      const maxRatingNum = parseFloat(maxRating);
      if (!isNaN(maxRatingNum) && maxRatingNum >= 0 && maxRatingNum <= 5) {
        whereConditions.push({ average_rating: { _lte: maxRatingNum } });
      }
    }

    // Location-based filtering (requires both lat/lon and radius)
    if (latitude && longitude && radiusKm) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const radius = parseFloat(radiusKm);
      
      if (!isNaN(lat) && !isNaN(lon) && !isNaN(radius) && radius > 0) {
        // Note: Hasura doesn't have built-in distance calculation
        // This would require a PostGIS function or client-side filtering
        // For now, we'll add a basic bounding box filter
        // TODO: Implement proper distance calculation with PostGIS
        whereConditions.push({
          _and: [
            { latitude: { _is_null: false } },
            { longitude: { _is_null: false } }
          ]
        });
      }
    }

    // Main location filter
    if (isMainLocation === 'true') {
      whereConditions.push({ is_main_location: { _eq: true } });
    } else if (isMainLocation === 'false') {
      whereConditions.push({ is_main_location: { _eq: false } });
    }

    // Build final where clause
    const where = whereConditions.length > 0 
      ? (whereConditions.length === 1 ? whereConditions[0] : { _and: whereConditions })
      : undefined;

    // Build order_by clause
    let orderByClause: any = { created_at: 'desc' }; // Default
    if (orderBy) {
      switch (orderBy) {
        case 'rating':
          orderByClause = { average_rating: 'desc_nulls_last' };
          break;
        case 'price':
          // Use price_range_id instead of price (which doesn't exist in Hasura schema)
          orderByClause = { price_range_id: 'asc_nulls_last' };
          break;
        case 'created_at':
          orderByClause = { created_at: 'desc' };
          break;
        case 'updated_at':
          orderByClause = { updated_at: 'desc' };
          break;
        // Note: 'distance' sorting requires client-side processing after fetch
        default:
          orderByClause = { created_at: 'desc' };
      }
    }

    // Build cache key from query params
    const cacheKeyParams = {
      limit,
      offset,
      status: status || 'publish',
      search: search || '',
      cuisine_ids: cuisineIds || '',
      palate_ids: palateIds || '',
      category_ids: categoryIds || '',
      price_range_id: priceRangeId || '',
      min_rating: minRating || '',
      max_rating: maxRating || '',
      latitude: latitude || '',
      longitude: longitude || '',
      radius_km: radiusKm || '',
      is_main_location: isMainLocation || '',
      order_by: orderBy || 'created_at'
    };
    
    // Get version for restaurants list
    const version = await getVersion('v:restaurants:all');
    
    // Create cache key (use a hash or JSON string of params)
    const paramsStr = JSON.stringify(cacheKeyParams);
    const cacheKey = `restaurants:v${version}:${paramsStr}`;
    
    const { value: responseData, hit } = await cacheGetOrSetJSON(
      cacheKey,
      30, // 30 seconds TTL
      async () => {
        const variables = {
          limit,
          offset,
          where,
          order_by: [orderByClause]
        };

        console.log('🔍 Fetching restaurants with variables:', JSON.stringify(variables, null, 2));
        
        let result;
        try {
          result = await hasuraQuery(GET_ALL_RESTAURANTS, variables);
        } catch (hasuraError) {
          console.error('❌ Hasura connection error:', hasuraError);
          const errorMessage = hasuraError instanceof Error ? hasuraError.message : 'Unknown Hasura error';
          throw new Error(`Failed to connect to Hasura: ${errorMessage}`);
        }

        if (result.errors) {
          console.error('❌ GraphQL errors:', JSON.stringify(result.errors, null, 2));
          throw new Error(result.errors[0]?.message || 'Unknown GraphQL error');
        }

        console.log('✅ GraphQL response received:', {
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          restaurantCount: result.data?.restaurants?.length || 0
        });

        const restaurants = result.data?.restaurants || [];
        const total = result.data?.restaurants_aggregate?.aggregate?.count || restaurants.length;

        // If distance sorting was requested, sort client-side (requires lat/lon)
        let sortedRestaurants = restaurants;
        if (orderBy === 'distance' && latitude && longitude) {
          const lat = parseFloat(latitude);
          const lon = parseFloat(longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            sortedRestaurants = [...restaurants].sort((a, b) => {
              if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
              const distA = calculateDistance(lat, lon, a.latitude, a.longitude);
              const distB = calculateDistance(lat, lon, b.latitude, b.longitude);
              return distA - distB;
            });
          }
        }

        // Apply radius filter if specified (client-side after distance sort)
        let filteredRestaurants = sortedRestaurants;
        if (latitude && longitude && radiusKm) {
          const lat = parseFloat(latitude);
          const lon = parseFloat(longitude);
          const radius = parseFloat(radiusKm);
          if (!isNaN(lat) && !isNaN(lon) && !isNaN(radius) && radius > 0) {
            filteredRestaurants = sortedRestaurants.filter(restaurant => {
              if (!restaurant.latitude || !restaurant.longitude) return false;
              const distance = calculateDistance(lat, lon, restaurant.latitude, restaurant.longitude);
              return distance <= radius;
            });
          }
        }

        return {
          success: true,
          data: filteredRestaurants,
          meta: {
            total: filteredRestaurants.length, // Use filtered count for hasMore calculation
            limit,
            offset,
            hasMore: offset + limit < total,
            fetchedAt: new Date().toISOString()
          }
        };
      }
    );
    
    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': hit ? 'HIT' : 'MISS'
      }
    });
  } catch (error) {
    console.error('❌ Get Restaurants API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch restaurants',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        hint: 'Check if the restaurants table exists and is tracked in Hasura'
      },
      { status: 500 }
    );
  }
}
