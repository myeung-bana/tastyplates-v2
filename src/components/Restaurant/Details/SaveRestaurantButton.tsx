"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { RestaurantService } from "@/services/restaurant/restaurantService";
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
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restaurantService = useMemo(() => new RestaurantService(), []);

  const checkFavoriteStatus = useCallback(async () => {
    if (!session?.accessToken || !restaurantSlug) return;
    try {
      const response = await restaurantService.checkFavoriteListing(
        restaurantSlug,
        session.accessToken
      );
      setSaved((response as { status: string }).status === "saved");
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [session?.accessToken, restaurantSlug, restaurantService]);

  const toggleFavorite = useCallback(async () => {
    if (!session?.user) {
      onShowSignin();
      return;
    }

    if (!session?.accessToken) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (saved) {
        await restaurantService.unsaveFavoriteListing(
          restaurantSlug,
          session.accessToken
        );
        setSaved(false);
        toast.success(removedFromWishlistSuccess);
      } else {
        await restaurantService.saveFavoriteListing(
          restaurantSlug,
          session.accessToken
        );
        setSaved(true);
        toast.success(savedToWishlistSuccess);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(favoriteStatusError);
      setError(favoriteStatusError);
    } finally {
      setLoading(false);
    }
  }, [saved, session?.user, session?.accessToken, restaurantSlug, restaurantService, onShowSignin]);

  useEffect(() => {
    let isMounted = true;
    if (!restaurantSlug || initialized) return;

    if (!session?.user) {
      if (isMounted) setInitialized(true);
      return;
    }

    const fetchFavoriteStatus = async () => {
      try {
        await checkFavoriteStatus();
      } catch (error) {
        console.error("Failed to fetch favorite status:", error);
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    fetchFavoriteStatus();
    return () => {
      isMounted = false;
    };
  }, [restaurantSlug, session, initialized, checkFavoriteStatus]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!initialized) {
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-semibold text-sm"
        disabled
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : saved ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart className="text-gray-500" />
      )}
      <span className="text-sm font-normal">{saved ? "Saved" : "Save"}</span>
    </button>
  );
};

export default SaveRestaurantButton;

