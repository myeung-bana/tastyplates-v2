import React, { useState, useEffect, useCallback, useRef } from 'react';
import RestaurantCard from '../RestaurantCard';
import RestaurantCardSkeleton from '../ui/Skeleton/RestaurantCardSkeleton';
import TabContentGrid from '../ui/TabContentGrid/TabContentGrid';
import { RestaurantService } from '@/services/restaurant/restaurantService';
import { Listing } from '@/interfaces/restaurant/restaurant';
import { DEFAULT_IMAGE } from '@/constants/images';

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
  targetUserId: number;
  isViewingOwnProfile: boolean;
}

const WishlistsTab: React.FC<WishlistsTabProps> = ({ targetUserId, isViewingOwnProfile }) => {
  const [wishlist, setWishlist] = useState<Restaurant[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  const restaurantService = useRef(new RestaurantService()).current;

  const transformNodes = useCallback((nodes: Listing[]): Restaurant[] => {
    return nodes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node?.sourceUrl || DEFAULT_IMAGE,
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

  const fetchWishlist = useCallback(async () => {
    if (!isViewingOwnProfile) {
      setWishlistLoading(false);
      return;
    }

    setWishlistLoading(true);
    try {
      const data = await restaurantService.fetchAllRestaurants(
        "",
        8,
        null,
        [],
        [],
        null,
        null,
        targetUserId,
        null,
        null,
        null,
        ["PUBLISH", "DRAFT"]
      );
      const transformed = transformNodes(data.nodes as unknown as Listing[]);
      setWishlist(transformed);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  }, [targetUserId, isViewingOwnProfile, transformNodes, restaurantService]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleWishlistChange = useCallback((restaurantId: string, isSaved: boolean) => {
    setWishlist(prev => 
      isSaved 
        ? prev.filter(rest => rest.id !== restaurantId)
        : prev
    );
  }, []);

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
    />
  );
};

export default WishlistsTab;
