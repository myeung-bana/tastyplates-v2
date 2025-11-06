import React, { useState, useEffect } from 'react';
import { Restaurant } from './Restaurant';
import { RestaurantService } from '@/services/restaurant/restaurantService';
import { getRegionalPalatesForSuggestions, RESTAURANT_CONSTANTS } from '@/constants/utils';
import RestaurantCard from './RestaurantCard';
import { Listing } from '@/interfaces/restaurant/restaurant';
import { getBestAddress } from '@/utils/addressUtils';

interface SuggestedRestaurantsProps {
  selectedPalates: string[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const restaurantService = new RestaurantService();

const SuggestedRestaurants: React.FC<SuggestedRestaurantsProps> = ({ 
  selectedPalates, 
  onRestaurantClick 
}) => {
  const [suggestedRestaurants, setSuggestedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapListingToRestaurant = (item: Listing): Restaurant => ({
    id: item.id,
    slug: item.slug,
    name: item.title,
    image: item.featuredImage?.node.sourceUrl || '/images/default-image.png',
    rating: item.averageRating,
    databaseId: item.databaseId || 0,
    palatesNames: item.palates.nodes?.map((c: { name: string }) => c.name) || [],
    listingCategories: item.listingCategories?.nodes.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
    countries: item.countries?.nodes.map((c) => c.name).join(", ") || "Default Location",
    priceRange: item.priceRange,
    initialSavedStatus: item.isFavorite ?? false,
    streetAddress: getBestAddress(
      item.listingDetails?.googleMapUrl, 
      item.listingStreet, 
      'No address available'
    ),
    googleMapUrl: item.listingDetails?.googleMapUrl,
    ratingsCount: item.ratingsCount ?? 0,
    searchPalateStats: item.searchPalateStats,
  });

  useEffect(() => {
    const fetchSuggestedRestaurants = async () => {
      if (!selectedPalates || selectedPalates.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const suggestedPalates = getRegionalPalatesForSuggestions(selectedPalates);
        
        if (suggestedPalates.length === 0) {
          setSuggestedRestaurants([]);
          return;
        }

        console.log('🔍 Fetching suggested restaurants for palates:', suggestedPalates);

        const data = await restaurantService.fetchAllRestaurants(
          '', // No search term
          RESTAURANT_CONSTANTS.SUGGESTED_RESULTS_COUNT,
          null, // No pagination
          null, // No cuisine filter
          suggestedPalates, // Use suggested palates
          null, // No price filter
          null, // No status filter
          null, // No user filter
          null, // No recognition filter
          null, // No sort option
          null, // No rating filter
          null, // No statuses filter
          null, // No address filter
          suggestedPalates.join(',') // Pass as ethnicSearch
        );

        const transformed = (data.nodes as unknown as Listing[]).map(mapListingToRestaurant);
        setSuggestedRestaurants(transformed);
      } catch (err) {
        console.error('Error fetching suggested restaurants:', err);
        setError('Failed to load suggested restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedRestaurants();
  }, [selectedPalates]);

  if (loading) {
    return (
      <div className="suggested-restaurants">
        <div className="suggested-restaurants__header">
          <h3 className="suggested-restaurants__title">
            {RESTAURANT_CONSTANTS.SUGGESTED_SECTION_TITLE}
          </h3>
          <p className="suggested-restaurants__subtitle">
            {RESTAURANT_CONSTANTS.SUGGESTED_SECTION_SUBTITLE}
          </p>
        </div>
        <div className="suggested-restaurants__loading">
          <p>{RESTAURANT_CONSTANTS.LOADING_MESSAGE}</p>
        </div>
      </div>
    );
  }

  if (error || suggestedRestaurants.length === 0) {
    return null; // Don't show section if no suggestions
  }

  return (
    <div className="suggested-restaurants">
      <div className="suggested-restaurants__header">
        <h3 className="suggested-restaurants__title">
          {RESTAURANT_CONSTANTS.SUGGESTED_SECTION_TITLE}
        </h3>
        <p className="suggested-restaurants__subtitle">
          {RESTAURANT_CONSTANTS.SUGGESTED_SECTION_SUBTITLE}
        </p>
      </div>
      
      <div className="suggested-restaurants__grid">
        {suggestedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={() => onRestaurantClick?.(restaurant)}
          />
        ))}
      </div>
    </div>
  );
};

export default SuggestedRestaurants;
