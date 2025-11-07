import React from 'react';
import RestaurantCard from '../Restaurant/RestaurantCard';
import RestaurantCardSkeleton from '../ui/Skeleton/RestaurantCardSkeleton';
import TabContentGrid from '../ui/TabContentGrid/TabContentGrid';

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  countries: string;
  priceRange: string;
  databaseId: number;
  palatesNames?: string[];
  averageRating?: number;
  ratingsCount?: number;
}

interface WishlistsTabProps {
  wishlist: Restaurant[];
  wishlistLoading: boolean;
  handleWishlistChange: (restaurantId: string, isSaved: boolean) => void;
}

const WishlistsTab: React.FC<WishlistsTabProps> = ({
  wishlist,
  wishlistLoading,
  handleWishlistChange,
}) => {

  return (
    <TabContentGrid
      items={wishlist}
      loading={wishlistLoading}
      ItemComponent={RestaurantCard}
      SkeletonComponent={RestaurantCardSkeleton}
      emptyMessage="No Wishlisted Restaurants Yet."
      itemProps={{ 
        profileTablist: "wishlists",
        initialSavedStatus: true,
        onWishlistChange: handleWishlistChange
      }}
      skeletonKeyPrefix="wishlist-skeleton"
      gridClassName="restaurants__grid restaurants__grid--profile"
    />
  );
};

export default WishlistsTab;
