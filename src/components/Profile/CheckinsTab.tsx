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

interface CheckinsTabProps {
  checkins: Restaurant[];
  checkinsLoading: boolean;
}

const CheckinsTab: React.FC<CheckinsTabProps> = ({
  checkins,
  checkinsLoading,
}) => {

  return (
    <TabContentGrid
      items={checkins}
      loading={checkinsLoading}
      ItemComponent={RestaurantCard}
      SkeletonComponent={RestaurantCardSkeleton}
      emptyHeading="No Check-ins Found"
      emptyMessage="No check-ins have been made yet."
      itemProps={{ profileTablist: "checkins" }}
      skeletonKeyPrefix="checkin-skeleton"
      gridClassName="restaurants__grid restaurants__grid--profile"
    />
  );
};

export default CheckinsTab;
