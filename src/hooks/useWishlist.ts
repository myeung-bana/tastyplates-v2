import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { RestaurantService } from '@/services/restaurant/restaurantService';
import customToast from '@/utils/toast';
import { 
  favoriteStatusError, 
  removedFromWishlistSuccess, 
  savedToWishlistSuccess 
} from '@/constants/messages';

interface UseWishlistOptions {
  restaurantSlug: string;
  initialSavedStatus?: boolean;
  onWishlistChange?: (isSaved: boolean) => void;
}

export const useWishlist = ({ 
  restaurantSlug, 
  initialSavedStatus = false,
  onWishlistChange 
}: UseWishlistOptions) => {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(initialSavedStatus);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restaurantService = new RestaurantService();

  const checkFavoriteStatus = useCallback(async () => {
    if (!session?.accessToken || !restaurantSlug) return;
    
    try {
      const response = await restaurantService.createFavoriteListing(
        { restaurant_slug: restaurantSlug, action: "check" },
        session.accessToken
      );
      
      // Check if response has the expected structure
      if (response && typeof response === 'object' && 'status' in response) {
        const isFavorite = (response as { status: string }).status === "saved";
        setSaved(isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [session?.accessToken, restaurantSlug, restaurantService]);

  const toggleFavorite = useCallback(async () => {
    if (!session?.user) {
      window.location.href = '/auth/signin';
      return;
    }

    if (!session?.accessToken) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const action = saved ? "remove" : "add";
      const response = await restaurantService.createFavoriteListing(
        { restaurant_slug: restaurantSlug, action },
        session.accessToken
      );
      
      // Check if response has the expected structure
      if (response && typeof response === 'object' && 'status' in response) {
        const newSavedState = (response as { status: string }).status === "saved";
        setSaved(newSavedState);
        
        customToast.success(newSavedState ? savedToWishlistSuccess : removedFromWishlistSuccess);
        onWishlistChange?.(newSavedState);
        
        // Dispatch custom event for global state updates
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { 
          detail: { slug: restaurantSlug, status: newSavedState } 
        }));
      } else {
        // If response structure is unexpected, revert state
        setSaved(!saved);
        customToast.error(favoriteStatusError);
      }
      
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setError(favoriteStatusError);
      customToast.error(favoriteStatusError);
    } finally {
      setLoading(false);
    }
  }, [saved, session?.user, session?.accessToken, restaurantSlug, restaurantService, onWishlistChange]);

  useEffect(() => {
    if (session?.user && !initialized) {
      checkFavoriteStatus();
      setInitialized(true);
    }
  }, [session?.user, initialized, checkFavoriteStatus]);

  return {
    saved,
    loading,
    error,
    toggleFavorite,
    isAuthenticated: !!session?.user
  };
};