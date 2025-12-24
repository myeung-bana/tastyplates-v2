import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useEffect, useState, useCallback } from "react";
import { FiMapPin } from "react-icons/fi";
import SignupModal from "@/components/auth/SignupModal";
import SigninModal from "@/components/auth/SigninModal";
import toast from "react-hot-toast";
import { checkInStatusError, checkInRestaurantSuccess, uncheckInRestaurantSuccess } from "@/constants/messages";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";

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

export default function CheckInRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { user, loading: sessionLoading } = useFirebaseSession();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  // Removed unused state

  useEffect(() => {
    let isMounted = true;
    // Wait for session to finish loading
    if (sessionLoading) return;
    if (!user || !restaurantSlug || initialized) return;
    
    const fetchCheckInStatus = async () => {
      try {
        const userUuid = await getUserUuid(user.id);
        if (!userUuid) {
          if (isMounted) setInitialized(true);
          return;
        }

        const response = await restaurantUserService.checkCheckinStatus({
          user_id: userUuid,
          restaurant_slug: restaurantSlug
        });

        if (isMounted && response.success) {
          setCheckedIn(response.data.status === "checkedin");
        }
      } catch (error) {
        console.error("Failed to fetch check-in status:", error);
        if (isMounted) {
          setError("Unable to fetch check-in status");
        }
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    fetchCheckInStatus();
    return () => { isMounted = false; };
  }, [restaurantSlug, user, sessionLoading, initialized]);

  const handleToggle = async () => {
    if (!user) {
      setError("Authentication required");
      return;
    }
    
    setLoading(true);
    setError(null);
    const prevCheckedIn = checkedIn;
    setCheckedIn(prev => !prev);
    window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: !checkedIn } }));
    
    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        throw new Error("Unable to get user ID");
      }

      const response = await restaurantUserService.toggleCheckin({
        user_id: userUuid,
        restaurant_slug: restaurantSlug
      });

      if (response.success) {
        const isCheckedIn = response.data.status === "checkedin";
        toast.success(isCheckedIn ? checkInRestaurantSuccess : uncheckInRestaurantSuccess);
        setCheckedIn(isCheckedIn);
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: isCheckedIn } }));
      } else {
        throw new Error(response.error || checkInStatusError);
      }
    } catch (error) {
      console.error("Error toggling check-in:", error);
      toast.error(checkInStatusError);
      setCheckedIn(prevCheckedIn);
      window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
      setError(error instanceof Error ? error.message : checkInStatusError);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans"
          onClick={() => setShowSignin(true)}
        >
          <FiMapPin className="w-4 h-4" />
          <span>Check-In</span>
        </button>
        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          onOpenSignin={() => {
            setShowSignup(false);
            setShowSignin(true);
          }}
        />
        <SigninModal
          isOpen={showSignin}
          onClose={() => setShowSignin(false)}
          onOpenSignup={() => {
            setShowSignin(false);
            setShowSignup(true);
          }}
        />
      </>
    );
  }

  // Show button immediately without loading spinner
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans ${
        checkedIn ? 'border-primary' : ''
      }`}
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={checkedIn}
    >
      <FiMapPin className={`w-4 h-4 ${checkedIn ? "text-primary" : "text-gray-500"}`} />
      <span className="font-normal">
        {checkedIn ? "Checked-in" : "Check-In"}
      </span>
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </button>
  );
}
