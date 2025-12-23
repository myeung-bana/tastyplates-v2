"use client";

import React, { useEffect, useState, useCallback } from "react";
import RestaurantCard from "@/components/Restaurant/RestaurantCard";
import SkeletonCard from "@/components/ui/Skeleton/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import "@/styles/pages/_restaurants.scss";

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
  googleMapUrl?: {
    streetAddress?: string;
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    stateShort?: string;
    country?: string;
    countryShort?: string;
    postCode?: string;
    latitude?: string;
    longitude?: string;
    placeId?: string;
    zoom?: number;
  };
  averageRating?: number;
  ratingsCount?: number;
  status?: string;
}

const restaurantService = new RestaurantService();

interface RecentlyVisitedRestaurantsProps {
  className?: string;
  showOnlyWhenEmpty?: boolean; // For ReviewSubmission: only show when no restaurant selected
}

const RecentlyVisitedRestaurants: React.FC<RecentlyVisitedRestaurantsProps> = ({
  className = '',
  showOnlyWhenEmpty = false,
}) => {
  const { firebaseUser } = useFirebaseSession();
  const [loadingVisited, setLoadingVisited] = useState(true);
  const [recentlyVisitedRestaurants, setRecentlyVisitedRestaurants] = useState<Restaurant[]>([]);

  // Helper: transform GraphQL node to Restaurant
  const transformNodes = useCallback((nodes: Record<string, unknown>[]): Restaurant[] => {
    return nodes.map((item: Record<string, unknown>) => {
      // Extract palates names from palates.nodes array
      const palatesNodes = ((item.palates as Record<string, unknown>)?.nodes as Record<string, unknown>[]) || [];
      const palatesNames = palatesNodes.map((p: Record<string, unknown>) => p.name as string).filter(Boolean);

      // Extract googleMapUrl from listingDetails
      const listingDetails = (item.listingDetails as Record<string, unknown>) || {};
      const googleMapUrl = (listingDetails.googleMapUrl as Record<string, unknown>) || {};

      // Extract countries from countries.nodes or use googleMapUrl
      const countriesNodes = ((item.countries as Record<string, unknown>)?.nodes as Record<string, unknown>[]) || [];
      const countries = countriesNodes.map((c: Record<string, unknown>) => c.name as string).join(", ") || 
                       ((googleMapUrl.country as string) || "Default Location");

      return {
        id: item.id as string,
        databaseId: (item.databaseId as number) || 0,
        slug: item.slug as string,
        name: item.title as string,
        image: ((item.featuredImage as Record<string, unknown>)?.node as Record<string, unknown>)?.sourceUrl as string || '',
        rating: parseFloat((item.averageRating as string) || "0") || 0,
        cuisineNames: palatesNames,
        countries: countries,
        priceRange: (item.priceRange as string) || "",
        palatesNames: palatesNames,
        googleMapUrl: Object.keys(googleMapUrl).length > 0 ? {
          streetAddress: googleMapUrl.streetAddress as string | undefined,
          streetNumber: googleMapUrl.streetNumber as string | undefined,
          streetName: googleMapUrl.streetName as string | undefined,
          city: googleMapUrl.city as string | undefined,
          state: googleMapUrl.state as string | undefined,
          stateShort: googleMapUrl.stateShort as string | undefined,
          country: googleMapUrl.country as string | undefined,
          countryShort: googleMapUrl.countryShort as string | undefined,
          postCode: googleMapUrl.postCode as string | undefined,
          latitude: googleMapUrl.latitude as string | undefined,
          longitude: googleMapUrl.longitude as string | undefined,
          placeId: googleMapUrl.placeId as string | undefined,
          zoom: googleMapUrl.zoom as number | undefined,
        } : undefined,
        averageRating: parseFloat((item.averageRating as string) || "0") || 0,
        ratingsCount: (item.ratingsCount as number) || 0,
        status: item.status as string | undefined,
      };
    });
  }, []);

  const fetchRecentlyVisited = useCallback(async () => {
    if (!firebaseUser) {
      setLoadingVisited(false);
      return;
    }

    setLoadingVisited(true);
    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      const visitedIds = await restaurantService.fetchRecentlyVisitedRestaurants(idToken);
      const restaurantPromises = (visitedIds as unknown as (string | number)[]).map((id: string | number) =>
        restaurantService.fetchRestaurantById(String(id))
      );
      const restaurants = await Promise.all(restaurantPromises);
      const transformed = transformNodes(restaurants);
      setRecentlyVisitedRestaurants(transformed);
    } catch (error) {
      console.error("Failed to fetch recently visited restaurants:", error);
    } finally {
      setLoadingVisited(false);
    }
  }, [firebaseUser, transformNodes]);

  useEffect(() => {
    fetchRecentlyVisited();
  }, [fetchRecentlyVisited]);

  return (
    <div className={`restaurants__container md:!px-4 xl:!px-0 mt-6 md:mt-10 w-full ${className}`}>
      <div className="restaurants__content mt-6 md:mt-10">
        <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-neusans">Recently Visited</h1>
        {recentlyVisitedRestaurants.length === 0 && !loadingVisited && (
          <p className="w-full text-center flex justify-center items-center py-8 text-gray-400 text-sm font-neusans">
            You haven't visited any restaurants yet.
          </p>
        )}
        <div className="restaurants__grid mt-6 md:mt-8">
          {recentlyVisitedRestaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
          {loadingVisited && [...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
};

export default RecentlyVisitedRestaurants;
