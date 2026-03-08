"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useNhostSession } from "@/hooks/useNhostSession";
import { FiBookmark } from "react-icons/fi";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";
import toast from "react-hot-toast";
import {
  favoriteStatusError,
  removedFromWishlistSuccess,
  savedToWishlistSuccess,
} from "@/constants/messages";

interface SaveRestaurantButtonProps {
  restaurantSlug: string;
  onShowSignin: () => void;
}

const SaveRestaurantButton: React.FC<SaveRestaurantButtonProps> = ({
  restaurantSlug,
  onShowSignin,
}) => {
  const { nhostUser, loading: sessionLoading } = useNhostSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFavoriteStatus = useCallback(async () => {
    if (!nhostUser?.id || !restaurantSlug) return;
    try {
      const response = await restaurantUserService.checkFavoriteStatus({
        user_id: nhostUser.id,
        restaurant_slug: restaurantSlug,
      });
      if (response.success) {
        setSaved(response.data.status === "saved");
      }
    } catch (err) {
      console.error("Error checking favorite status:", err);
    }
  }, [nhostUser, restaurantSlug]);

  const toggleFavorite = useCallback(async () => {
    if (!nhostUser) {
      onShowSignin();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await restaurantUserService.toggleFavorite({
        user_id: nhostUser.id,
        restaurant_slug: restaurantSlug,
      });

      if (response.success) {
        const isSaved = response.data.status === "saved";
        setSaved(isSaved);
        toast.success(isSaved ? savedToWishlistSuccess : removedFromWishlistSuccess);
      } else {
        throw new Error(response.error || favoriteStatusError);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error(favoriteStatusError);
      setError(err instanceof Error ? err.message : favoriteStatusError);
    } finally {
      setLoading(false);
    }
  }, [nhostUser, restaurantSlug, onShowSignin]);

  useEffect(() => {
    let isMounted = true;
    if (sessionLoading) return;
    if (!restaurantSlug || initialized) return;

    if (!nhostUser) {
      if (isMounted) setInitialized(true);
      return;
    }

    const fetchFavoriteStatus = async () => {
      try {
        await checkFavoriteStatus();
      } catch (err) {
        console.error("Failed to fetch favorite status:", err);
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    fetchFavoriteStatus();
    return () => {
      isMounted = false;
    };
  }, [restaurantSlug, nhostUser, sessionLoading, initialized, checkFavoriteStatus]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans"
    >
      {saved ? (
        <FiBookmark className="w-4 h-4 text-orange-500" fill="currentColor" />
      ) : (
        <FiBookmark className="w-4 h-4 text-gray-500" />
      )}
      <span className="text-sm font-normal">{saved ? "Saved" : "Save"}</span>
    </button>
  );
};

export default SaveRestaurantButton;
