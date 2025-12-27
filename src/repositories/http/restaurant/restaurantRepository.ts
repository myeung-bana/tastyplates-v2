// repositories/restaurant/restaurantRepository.ts
import { RestaurantRepo } from "@/repositories/interface/user/restaurant";
import { FavoriteListingData, CheckInData } from "@/interfaces/restaurant/restaurant";
import HttpMethods from "../requests";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";

const request = new HttpMethods();

export class RestaurantRepository implements RestaurantRepo {
    async getRestaurantBySlug(slug: string, palates: string) {
        try {
            const response = await restaurantV2Service.getRestaurantBySlug(slug);
            
            if (!response.success || !response.data) {
                console.error('Failed to fetch restaurant by slug:', response.error);
                return null;
            }

            // Return the restaurant data in the expected format
            const restaurant = response.data;
            return {
                id: restaurant.uuid,
                title: restaurant.title,
                slug: restaurant.slug,
                content: restaurant.content || '',
                databaseId: restaurant.id,
                featuredImage: restaurant.featured_image_url ? {
                    node: {
                        sourceUrl: restaurant.featured_image_url
                    }
                } : undefined,
                listingDetails: {
                    latitude: restaurant.latitude?.toString() || '',
                    longitude: restaurant.longitude?.toString() || '',
                    phone: restaurant.phone || '',
                    openingHours: JSON.stringify(restaurant.opening_hours || {}),
                    menuUrl: restaurant.menu_url || '',
                },
                palates: {
                    nodes: Array.isArray(restaurant.palates)
                        ? restaurant.palates.map(p => ({
                            name: p.name,
                            slug: p.slug
                        }))
                        : []
                },
                listingCategories: {
                    nodes: Array.isArray(restaurant.categories)
                        ? restaurant.categories.map(c => ({
                            name: c.name,
                            slug: c.slug
                        }))
                        : []
                }
            } as unknown as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching restaurant by slug:', error);
            return null;
        }
    }

    async getAllRestaurants(
        searchTerm: string,
        first = 8,
        after: string | null = null,
        taxQuery: Record<string, unknown> = {},
        priceRange?: string | null,
        status: string | null = null,
        userId?: number | null,
        recognition: string | null = null,
        sortOption?: string | null,
        rating: number | null = null,
        statuses: string[] | null = null,
        address: string | null = null,
        ethnicSearch: string | null = null,
        palates?: string,
        orderBy?: unknown[]
    ) {
        try {
            // Calculate offset from cursor
            const offset = after ? parseInt(after) || 0 : 0;

            // Map parameters to V2 API format
            const params: any = {
                limit: first,
                offset: offset,
                search: searchTerm || undefined,
                status: status || 'publish',
            };

            // Add rating filter if specified
            if (rating !== null && rating > 0) {
                params.min_rating = rating;
            }

            // Note: Additional filtering (cuisine, palate, price) will be handled by the service
            // when those features are fully implemented in V2 API

            const response = await restaurantV2Service.getAllRestaurants(params);

            if (!response.success) {
                console.error('Failed to fetch restaurants:', response.error);
                return {
                    nodes: [],
                    pageInfo: { endCursor: null, hasNextPage: false }
                };
            }

            // Transform to legacy format for backward compatibility
            const nodes = (response.data || []).map(restaurant => ({
                id: restaurant.uuid,
                title: restaurant.title,
                slug: restaurant.slug,
                content: restaurant.content || '',
                databaseId: restaurant.id,
                status: restaurant.status,
                priceRange: restaurant.restaurant_price_range?.symbol || '',
                averageRating: restaurant.average_rating || 0,
                listingStreet: restaurant.listing_street || '',
                featuredImage: restaurant.featured_image_url ? {
                    node: {
                        sourceUrl: restaurant.featured_image_url
                    }
                } : undefined,
                palates: {
                    nodes: Array.isArray(restaurant.palates) 
                        ? restaurant.palates.map(p => ({
                            name: p.name,
                            slug: p.slug
                        }))
                        : []
                },
                listingCategories: {
                    nodes: Array.isArray(restaurant.categories)
                        ? restaurant.categories.map(c => ({
                            name: c.name,
                            slug: c.slug
                        }))
                        : []
                },
                listingDetails: {
                    googleMapUrl: {
                        streetAddress: restaurant.address?.street_address || restaurant.listing_street || '',
                        streetNumber: restaurant.address?.street_number || '',
                        streetName: restaurant.address?.street_name || '',
                        city: restaurant.address?.city || '',
                        state: restaurant.address?.state || '',
                        stateShort: restaurant.address?.state_short || '',
                        country: restaurant.address?.country || '',
                        countryShort: restaurant.address?.country_short || '',
                        postCode: restaurant.address?.post_code || '',
                        latitude: restaurant.latitude?.toString() || '',
                        longitude: restaurant.longitude?.toString() || '',
                        placeId: restaurant.address?.place_id || '',
                        zoom: restaurant.google_zoom || 15
                    }
                },
                ratingsCount: restaurant.ratings_count || 0
            }));

            // Update pagination with next offset
            const nextOffset = offset + first;
            const hasMore = response.meta?.hasMore || false;

            return {
                nodes,
                pageInfo: {
                    endCursor: hasMore ? nextOffset.toString() : null,
                    hasNextPage: hasMore
                }
            };
        } catch (error) {
            console.error('Error fetching all restaurants:', error);
            return {
                nodes: [],
                pageInfo: { endCursor: null, hasNextPage: false }
            };
        }
    }

    async getRestaurantById(id: number) {
        try {
            const response = await restaurantV2Service.getRestaurantById(id.toString());
            
            if (!response.success || !response.data) {
                console.error('Failed to fetch restaurant by ID:', response.error);
                return null;
            }

            return response.data as unknown as Record<string, unknown>;
        } catch (error) {
            console.error('Error fetching restaurant by ID:', error);
            return null;
        }
    }

    async getRestaurantByName(name: string) {
        try {
            // Search for restaurant by name using getAllRestaurants
            const response = await this.getAllRestaurants(name, 1, null);
            return response.nodes[0] as unknown as Record<string, unknown> || null;
        } catch (error) {
            console.error('Error fetching restaurant by name:', error);
            return null;
        }
    }

    async getRestaurantListingName() {
        try {
            // Fetch all restaurants without filtering
            const response = await this.getAllRestaurants('', 100, null);
            return {
                listings: {
                    nodes: response.nodes
                }
            };
        } catch (error) {
            console.error('Error fetching restaurant listing names:', error);
            return { listings: { nodes: [] } };
        }
    }

    async getListingsName(
        searchTerm: string,
        first: number = 32,
        after: string | null = null
    ): Promise<{ nodes: Record<string, unknown>[]; pageInfo: Record<string, unknown>; hasNextPage: boolean; endCursor: string }> {
        try {
            // Use getAllRestaurants with search term
            const response = await this.getAllRestaurants(searchTerm, first, after);
            return {
                nodes: response.nodes,
                pageInfo: response.pageInfo,
                hasNextPage: response.pageInfo.hasNextPage as boolean || false,
                endCursor: (response.pageInfo.endCursor as string) || ''
            };
        } catch (error) {
            console.error('Error fetching listings name:', error);
            return {
                nodes: [],
                pageInfo: { endCursor: null, hasNextPage: false },
                hasNextPage: false,
                endCursor: ''
            };
        }
    }

    async getAddressByPalate(
        palates: string,
        first: number,
        after: string | null,
        withTax: boolean,
        taxQuery?: unknown
    ) {
        try {
            // Use getAllRestaurants with palate filtering
            // Note: This will need proper palate filtering implementation in V2 API
            const response = await this.getAllRestaurants('', first, after, {}, null, null, null, null, null, null, null, null, palates);
            return response;
        } catch (error) {
            console.error('Error fetching address by palate:', error);
            return {
                nodes: [],
                pageInfo: { endCursor: null, hasNextPage: false }
            };
        }
    }

    async saveRestaurant(listingData: FavoriteListingData, idToken: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.POST(
                `/api/v1/restaurant-users/toggle-favorite`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        restaurant_id: listingData.restaurantId,
                        is_saved: listingData.isSaved,
                    }),
                }
            );
            return response;
        } catch (error) {
            console.error('Error saving restaurant:', error);
            throw error;
        }
    }

    async checkInRestaurant(checkInData: CheckInData, idToken: string): Promise<Record<string, unknown>> {
        try {
            const response = await request.POST(
                `/api/v1/restaurant-users/toggle-checkin`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        restaurant_id: checkInData.restaurantId,
                        is_checked_in: checkInData.isCheckedIn,
                    }),
                }
            );
            return response;
        } catch (error) {
            console.error('Error checking in restaurant:', error);
            throw error;
        }
    }

    async addRecentlyVisitedRestaurant(restaurantId: string): Promise<Record<string, unknown>> {
        try {
            // Store in localStorage for now (can be migrated to Hasura if needed)
            if (typeof window !== 'undefined') {
                const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
                const updated = [restaurantId, ...visited.filter((id: string) => id !== restaurantId)].slice(0, 10);
                localStorage.setItem('recentlyVisited', JSON.stringify(updated));
            }
            return { success: true };
        } catch (error) {
            console.error('Error adding recently visited restaurant:', error);
            return { success: false };
        }
    }

    async getRecentlyVisitedRestaurants(first: number): Promise<Record<string, unknown>> {
        try {
            // Retrieve from localStorage
            if (typeof window !== 'undefined') {
                const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
                return {
                    recentlyVisited: {
                        nodes: visited.slice(0, first)
                    }
                };
            }
            return { recentlyVisited: { nodes: [] } };
        } catch (error) {
            console.error('Error getting recently visited restaurants:', error);
            return { recentlyVisited: { nodes: [] } };
        }
    }
}
