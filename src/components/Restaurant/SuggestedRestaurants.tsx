import React, { useState, useEffect } from 'react';
import { Restaurant } from './Restaurant';
import { restaurantV2Service } from '@/app/api/v1/services/restaurantV2Service';
import { transformRestaurantV2ToRestaurant } from '@/utils/restaurantTransformers';
import { getRegionalPalatesForSuggestions, RESTAURANT_CONSTANTS } from '@/constants/utils';
import RestaurantCard from './RestaurantCard';

interface SuggestedRestaurantsProps {
  selectedPalates: string[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const SuggestedRestaurants: React.FC<SuggestedRestaurantsProps> = ({ 
  selectedPalates, 
  onRestaurantClick 
}) => {
  const [suggestedRestaurants, setSuggestedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestedRestaurants = async () => {
      if (!selectedPalates || selectedPalates.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const suggestedCuisineSlugs = getRegionalPalatesForSuggestions(selectedPalates);
        
        if (suggestedCuisineSlugs.length === 0) {
          setSuggestedRestaurants([]);
          return;
        }

        const response = await restaurantV2Service.getAllRestaurants({
          limit: RESTAURANT_CONSTANTS.SUGGESTED_RESULTS_COUNT,
          offset: 0,
          status: 'publish',
          cuisine_slugs: suggestedCuisineSlugs,
        });

        const transformed = (response.data || []).map(transformRestaurantV2ToRestaurant);
        setSuggestedRestaurants(transformed);
      } catch (err) {
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
