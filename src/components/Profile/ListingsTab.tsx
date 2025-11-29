import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import RestaurantCard from '../Restaurant/RestaurantCard';
import RestaurantCardSkeleton from '../ui/Skeleton/RestaurantCardSkeleton';
import TabContentGrid from '../ui/TabContentGrid/TabContentGrid';
import { RestaurantService } from '@/services/restaurant/restaurantService';
import { Listing } from '@/interfaces/restaurant/restaurant';
import { DEFAULT_RESTAURANT_IMAGE } from '@/constants/images';

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

interface ListingsTabProps {
  targetUserId: number;
  isViewingOwnProfile: boolean;
}

const ListingsTab: React.FC<ListingsTabProps> = ({ targetUserId, isViewingOwnProfile }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [listingLoading, setListingLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);

  const restaurantService = useRef(new RestaurantService()).current;

  const statuses = useMemo(() => 
    isViewingOwnProfile ? ["PUBLISH", "DRAFT"] : ["PUBLISH"], 
    [isViewingOwnProfile]
  );

  const transformNodes = useCallback((nodes: Listing[]): Restaurant[] => {
    return nodes
      .filter((item) => item != null) // Filter out null/undefined items
      .map((item) => ({
        id: item.id || '',
        slug: item.slug || '',
        name: item.title || 'Untitled',
        image: item.featuredImage?.node?.sourceUrl || DEFAULT_RESTAURANT_IMAGE,
        rating: item.averageRating || 0,
        databaseId: item.databaseId || 0,
        palatesNames: Array.isArray(item?.palates?.nodes)
          ? item.palates.nodes.map((p: Record<string, unknown>) => (p?.name as string) ?? "Unknown")
          : [],
        streetAddress: item?.listingDetails?.googleMapUrl?.streetAddress || "",
        countries: Array.isArray(item?.countries?.nodes)
          ? item.countries.nodes.map((c: Record<string, unknown>) => (c?.name as string) ?? "Unknown").join(", ")
          : "Default Location",
        priceRange: item.priceRange ?? "N/A",
        averageRating: item.averageRating ?? 0,
        ratingsCount: item.ratingsCount ?? 0,
        status: item.status || "",
      }));
  }, []);

  const fetchRestaurants = useCallback(async (
    first = 8,
    after: string | null = null,
    userId: number | undefined
  ) => {
    setListingLoading(true);
    try {
      const data = await restaurantService.fetchAllRestaurants(
        "",
        first,
        after,
        [],
        [],
        null,
        null,
        userId,
        null,
        null,
        null,
        statuses
      );
      const transformed = transformNodes(data.nodes as unknown as Listing[]);

      setRestaurants((prev) => {
        if (!after) {
          return transformed;
        }
        const all = [...prev, ...transformed];
        const uniqueMap = new Map(all.map((r) => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

      setEndCursor(data.pageInfo.endCursor as string | null);
      setHasNextPage(data.pageInfo.hasNextPage as boolean);
    } catch (error) {
      console.error(error);
    } finally {
      setListingLoading(false);
    }
  }, [statuses, transformNodes]);

  useEffect(() => {
    if (targetUserId) {
      fetchRestaurants(8, null, targetUserId);
    }
    return () => {
      setRestaurants([]);
    };
  }, [targetUserId, fetchRestaurants]);

  return (
    <TabContentGrid
      items={restaurants}
      loading={listingLoading}
      ItemComponent={RestaurantCard}
      SkeletonComponent={RestaurantCardSkeleton}
      emptyHeading="No Listings Found"
      emptyMessage="No listings have been made yet."
      itemProps={{ profileTablist: "listings" }}
      skeletonKeyPrefix="listing-skeleton"
      gridClassName="restaurants__grid restaurants__grid--profile"
    />
  );
};

export default ListingsTab;
