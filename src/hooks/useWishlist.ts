import { useState, useCallback, useEffect } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
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
  const { user, firebaseUser } = useFirebaseSession();
  const [saved, setSaved] = useState(initialSavedStatus);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restaurantService = new RestaurantService();

  const checkFavoriteStatus = useCallback(async () => {
    if (!firebaseUser || !restaurantSlug) return;
    
    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      const response = await restaurantService.createFavoriteListing(
        { restaurant_slug: restaurantSlug, action: "check" },
        idToken
      );
      
      // Check if response has the expected structure
      if (response && typeof response === 'object' && 'status' in response) {
        const isFavorite = (response as { status: string }).status === "saved";
        setSaved(isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [firebaseUser, restaurantSlug, restaurantService]);

  const toggleFavorite = useCallback(async () => {
    if (!user || !firebaseUser) {
      window.location.href = '/signin';
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      const action = saved ? "remove" : "add";
      const response = await restaurantService.createFavoriteListing(
        { restaurant_slug: restaurantSlug, action },
        idToken
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
  }, [saved, user, firebaseUser, restaurantSlug, restaurantService, onWishlistChange]);

  useEffect(() => {
    if (user && !initialized) {
      checkFavoriteStatus();
      setInitialized(true);
    }
  }, [user, initialized, checkFavoriteStatus]);

  return {
    saved,
    loading,
    error,
    toggleFavorite,
    isAuthenticated: !!user
  };
};