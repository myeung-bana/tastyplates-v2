"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";
import toast from "react-hot-toast";
import {
  favoriteStatusError,
  removedFromWishlistSuccess,
  savedToWishlistSuccess,
} from "@/constants/messages";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to get user UUID from session
const getUserUuid = async (sessionUserId: string | number | undefined): Promise<string | null> => {
  if (!sessionUserId) return null;
  
  const userIdStr = String(sessionUserId);
  
  // Check if it's already a UUID
  if (UUID_REGEX.test(userIdStr)) {
    return userIdStr;
  }
  
  // If not a UUID, assume it's firebase_uuid and fetch the user
  try {
    const response = await restaurantUserService.getUserByFirebaseUuid(userIdStr);
    if (response.success && response.data) {
      return response.data.id;
    }
  } catch (error) {
    console.error("Error fetching user UUID:", error);
  }
  
  return null;
};

interface SaveRestaurantButtonProps {
  restaurantSlug: string;
  onShowSignin: () => void;
}

const SaveRestaurantButton: React.FC<SaveRestaurantButtonProps> = ({
  restaurantSlug,
  onShowSignin,
}) => {
  const { user, loading: sessionLoading } = useFirebaseSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFavoriteStatus = useCallback(async () => {
    if (!user || !restaurantSlug) return;
    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) return;

      const response = await restaurantUserService.checkFavoriteStatus({
        user_id: userUuid,
        restaurant_slug: restaurantSlug
      });

      if (response.success) {
        setSaved(response.data.status === "saved");
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [user, restaurantSlug]);

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      onShowSignin();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        throw new Error("Unable to get user ID");
      }

      const response = await restaurantUserService.toggleFavorite({
        user_id: userUuid,
        restaurant_slug: restaurantSlug
      });

      if (response.success) {
        const isSaved = response.data.status === "saved";
        setSaved(isSaved);
        toast.success(isSaved ? savedToWishlistSuccess : removedFromWishlistSuccess);
      } else {
        throw new Error(response.error || favoriteStatusError);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(favoriteStatusError);
      setError(error instanceof Error ? error.message : favoriteStatusError);
    } finally {
      setLoading(false);
    }
  }, [user, restaurantSlug, onShowSignin]);

  useEffect(() => {
    let isMounted = true;
    // Wait for session to finish loading
    if (sessionLoading) return;
    if (!restaurantSlug || initialized) return;

    if (!user) {
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
  }, [restaurantSlug, user, sessionLoading, initialized, checkFavoriteStatus]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // Show button immediately without loading spinner
  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans"
    >
      {saved ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart className="text-gray-500" />
      )}
      <span className="text-sm font-normal">{saved ? "Saved" : "Save"}</span>
    </button>
  );
};

export default SaveRestaurantButton;

