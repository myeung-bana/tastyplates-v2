// services/restaurant/restaurantService.ts
import { CheckInData, FavoriteListingData } from "@/interfaces/restaurant/restaurant";
import { RestaurantRepository } from "@/repositories/http/restaurant/restaurantRepository";
import { RestaurantRepo } from "@/repositories/interface/user/restaurant";
import { RESTAURANT_CONSTANTS } from '@/constants/utils';

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  countries: string;
  priceRange: string;
  databaseId: number;
  palatesNames?: string[];
  listingCategories?: { id: number; name: string; slug: string }[];
  initialSavedStatus?: boolean | null;
  recognitions?: string[];
  recognitionCount?: number;
  streetAddress?: string;
  googleMapUrl?: {
    city?: string;
    country?: string;
    countryShort?: string;
    streetAddress?: string;
    streetNumber?: string;
    streetName?: string;
    state?: string;
    stateShort?: string;
    postCode?: string;
    latitude?: string;
    longitude?: string;
    placeId?: string;
    zoom?: number;
  };
  ratingsCount?: number;
  searchPalateStats?: {
    avg: number;
    count: number;
  };
}

const restaurantRepo: RestaurantRepo = new RestaurantRepository()

export class RestaurantService {
    async fetchRestaurantDetails(slug: string, palates: string | null = null) {
        return await restaurantRepo.getRestaurantBySlug(slug, palates ?? '');
    }

    async fetchAllRestaurants(
        searchTerm: string,
        first: number = RESTAURANT_CONSTANTS.DEFAULT_RESULTS_PER_PAGE,
        after: string | null = null,
        cuisineSlug: string[] | null = null,
        palateSlugs: string[] = [],
        priceRange?: string | null,
        status: string | null = null,
        userId?: number | null,
        recognition: string | null = null,
        sortOption?: string | null,
        rating: number | null = null,
        statuses: string[] | null = null,
        address: string | null = null,
        ethnicSearch: string | null = null
    ) {
        try {
            const taxArray = [];

            if (cuisineSlug && cuisineSlug.length > 0 && cuisineSlug[0] !== 'all') {
                taxArray.push({
                    taxonomy: 'LISTINGCATEGORY',
                    field: 'SLUG',
                    terms: cuisineSlug,
                    operator: 'IN',
                });
            }

            // Note: Palate filtering is now handled via palateReviewedBy parameter
            // instead of taxQuery to find restaurants reviewed by users with specific palates

            const taxQuery = taxArray.length > 0 ? {
                relation: 'AND',
                taxArray: taxArray,
            } : {};

            // Disable backend ordering and rely on client-side sorting for better control
            // This ensures palate-based ranking works correctly
            const orderBy = null;

            console.log('🔍 RestaurantService parameters:', {
                searchTerm,
                taxQuery,
                ethnicSearch,
                palates: palateSlugs.join(','),
                palateSlugs,
                address
            });

            return await restaurantRepo.getAllRestaurants(
                searchTerm,
                first,
                after,
                taxQuery,
                priceRange,
                status,
                userId,
                recognition,
                sortOption,
                rating,
                statuses,
                address,
                ethnicSearch,
                palateSlugs.join(','), // Pass palates as comma-separated string
                orderBy || undefined
            );
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error('Failed to fetch list');
        }
    }

    async addRecentlyVisitedRestaurant(restaurantId: number, accessToken: string) {
        try {
            return await restaurantRepo.addRecentlyVisitedRestaurant(restaurantId, accessToken);
        } catch (error) {
            console.error('Error adding recently visited restaurant:', error);
            throw new Error('Failed to add recently visited restaurant');
        }
    }

    async fetchRecentlyVisitedRestaurants(accessToken?: string) {
        try {
            return await restaurantRepo.getRecentlyVisitedRestaurants(accessToken);
        } catch (error) {
            console.error('Error fetching recently visited restaurants:', error);
            throw new Error('Failed to fetch recently visited restaurants');
        }
    }

    async fetchAddressByPalate(
        searchTerm: string,
        palateSlugs: string[],
        first = 32,
        after: string | null = null
    ) {
        try {
            const taxQuery = palateSlugs.length > 0 ? {
                relation: 'AND',
                taxArray: [
                    {
                        taxonomy: 'PALATE',
                        field: 'SLUG',
                        terms: palateSlugs,
                        operator: 'IN',
                    },
                ],
            } : {};

            return await restaurantRepo.getAddressByPalate(searchTerm, taxQuery, first, after);
        } catch (error) {
            console.error('Error fetching by palate:', error);
            throw new Error('Failed to fetch restaurants by palate');
        }
    }

    async fetchListingsName(
        searchTerm: string,
        first = 32,
        after: string | null = null,
    ) {
        try {
            return await restaurantRepo.getListingsName(searchTerm, first, after);
        } catch (error) {
            console.error('Error fetching listings name:', error);
            throw new Error('Failed to fetch listings name');
        }
    }

    /**
     * Sort restaurants by location relevance with improved algorithm
     * Prioritizes restaurants whose addresses contain the location keyword
     */
    sortRestaurantsByLocation(restaurants: Restaurant[], locationKeyword: string): Restaurant[] {
        if (!locationKeyword || !locationKeyword.trim()) {
            return restaurants;
        }

        const keyword = locationKeyword.toLowerCase().trim();
        
        return restaurants.sort((a, b) => {
            const aRelevance = this.calculateLocationRelevance(a, keyword);
            const bRelevance = this.calculateLocationRelevance(b, keyword);
            
            // Sort by relevance score (higher first)
            if (bRelevance !== aRelevance) {
                return bRelevance - aRelevance;
            }
            
            // If relevance is the same, sort by rating
            return (b.rating || 0) - (a.rating || 0);
        });
    }

    /**
     * Get the best address string from a restaurant
     * Based on the address formatting documentation
     */
    private getRestaurantAddress(restaurant: Restaurant): string {
        // Priority 1: Use streetAddress if available (most complete)
        if (restaurant.streetAddress && restaurant.streetAddress.trim().length > 0) {
            return restaurant.streetAddress;
        }
        
        // Priority 2: Use Google Map URL street address
        if (restaurant.googleMapUrl?.streetAddress && restaurant.googleMapUrl.streetAddress.trim().length > 0) {
            return restaurant.googleMapUrl.streetAddress;
        }
        
        // Priority 3: Compose from individual components
        if (restaurant.googleMapUrl) {
            const parts = [
                [restaurant.googleMapUrl.streetNumber, restaurant.googleMapUrl.streetName].filter(Boolean).join(' '),
                restaurant.googleMapUrl.city,
                restaurant.googleMapUrl.stateShort || restaurant.googleMapUrl.state,
                restaurant.googleMapUrl.countryShort || restaurant.googleMapUrl.country,
                restaurant.googleMapUrl.postCode
            ].filter(Boolean) as string[];
            
            if (parts.length > 0) {
                return parts.join(', ');
            }
        }
        
        // Priority 4: Use countries field
        if (restaurant.countries && restaurant.countries !== "Default Location") {
            return restaurant.countries;
        }
        
        return '';
    }

    /**
     * Calculate location relevance score for a restaurant
     * Higher score means more relevant to the location
     */
    calculateLocationRelevance(restaurant: Restaurant, locationKeyword: string): number {
        if (!locationKeyword || !locationKeyword.trim()) {
            return 0;
        }

        const keyword = locationKeyword.toLowerCase().trim();
        const keywordWords = keyword.split(/\s+/).filter(word => word.length > 1);
        
        let totalScore = 0;
        
        // Search across all googleMapUrl fields with different weights
        if (restaurant.googleMapUrl) {
            const fieldsToSearch = [
                { field: restaurant.googleMapUrl.streetAddress, weight: 40, name: 'streetAddress' },
                { field: restaurant.googleMapUrl.city, weight: 35, name: 'city' },
                { field: restaurant.googleMapUrl.state, weight: 30, name: 'state' },
                { field: restaurant.googleMapUrl.stateShort, weight: 30, name: 'stateShort' },
                { field: restaurant.googleMapUrl.country, weight: 25, name: 'country' },
                { field: restaurant.googleMapUrl.countryShort, weight: 25, name: 'countryShort' },
                { field: restaurant.googleMapUrl.streetName, weight: 20, name: 'streetName' },
                { field: restaurant.googleMapUrl.postCode, weight: 15, name: 'postCode' }
            ];

            // Check each field for matches
            for (const { field, weight, name } of fieldsToSearch) {
                if (field) {
                    const fieldValue = field.toLowerCase();
                    
                    // Check for exact phrase match (highest priority)
                    if (fieldValue.includes(keyword)) {
                        totalScore += weight;
                    }
                    
                    // Check each word in the keyword
                    for (const word of keywordWords) {
                        if (fieldValue.includes(word)) {
                            totalScore += Math.floor(weight * 0.7); // Partial word match gets 70% of field weight
                        }
                    }
                }
            }
        }
        
        // Also check the composed address for additional matches
        const address = this.getRestaurantAddress(restaurant).toLowerCase();
        if (address) {
            // Bonus for full address match
            if (address.includes(keyword)) {
                totalScore += 15;
            }
            
            // Check individual words in the composed address
            for (const word of keywordWords) {
                const wordScore = this.calculateWordRelevance(address, word);
                totalScore += Math.floor(wordScore * 0.3); // Reduced weight since we're already checking individual fields
            }
        }
        
        return totalScore;
    }

    /**
     * Calculate relevance score for a single word
     */
    private calculateWordRelevance(address: string, word: string): number {
        // Exact word match (word boundaries) - highest score
        const exactMatch = new RegExp(`\\b${word}\\b`, 'i').test(address);
        if (exactMatch) return 25;
        
        // Partial word match - medium score
        if (address.includes(word)) return 15;
        
        // No match
        return 0;
    }

    /**
     * Check if address has partial match with keyword
     * Uses word boundary matching for better accuracy
     */
    private hasPartialMatch(address: string, keyword: string): boolean {
        // Split keyword into words and check if any word appears in address
        const keywordWords = keyword.split(/\s+/).filter(word => word.length > 2);
        
        return keywordWords.some(word => {
            // Use word boundary regex for better matching
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(address);
        });
    }
}