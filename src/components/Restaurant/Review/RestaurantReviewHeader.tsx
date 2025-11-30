import React from 'react';
import Image from 'next/image';
import { getCityCountry } from '@/utils/addressUtils';
import { GoogleMapUrl } from '@/utils/addressUtils';

interface RestaurantReviewHeaderProps {
  restaurantName: string;
  restaurantImage?: string;
  restaurantLocation?: string;
  googleMapUrl?: GoogleMapUrl | null;
}

const RestaurantReviewHeader: React.FC<RestaurantReviewHeaderProps> = ({
  restaurantName,
  restaurantImage,
  restaurantLocation,
  googleMapUrl
}) => {
  // Use getCityCountry for consistent location display, fallback to restaurantLocation
  const displayLocation = googleMapUrl 
    ? getCityCountry(googleMapUrl, restaurantLocation || 'Location not available')
    : restaurantLocation || 'Location not available';

  return (
    <div className="restaurant-review-header">
      <div className="restaurant-review-header__image">
        <Image 
          src={restaurantImage || "/placeholder-restaurant.jpg"}
          alt={restaurantName}
          width={75}
          height={75}
          className="rounded-full object-cover"
        />
      </div>
      <div className="restaurant-review-header__info">
        <h1 className="restaurant-review-header__name">{restaurantName}</h1>
        <p className="restaurant-review-header__location">{displayLocation}</p>
      </div>
    </div>
  );
};

export default RestaurantReviewHeader;
