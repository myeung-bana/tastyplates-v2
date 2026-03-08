"use client";
import { useNhostSession } from "@/hooks/useNhostSession";
import { useEffect, useState, useCallback } from "react";
import { FiMapPin } from "react-icons/fi";
import SignupModal from "@/components/auth/SignupModal";
import SigninModal from "@/components/auth/SigninModal";
import toast from "react-hot-toast";
import {
  checkInStatusError,
  checkInRestaurantSuccess,
  uncheckInRestaurantSuccess,
} from "@/constants/messages";
import { restaurantUserService } from "@/app/api/v1/services/restaurantUserService";

export default function CheckInRestaurantButton({
  restaurantSlug,
}: {
  restaurantSlug: string;
}) {
  const { nhostUser, loading: sessionLoading } = useNhostSession();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (sessionLoading) return;
    if (!nhostUser?.id || !restaurantSlug || initialized) return;

    const fetchCheckInStatus = async () => {
      try {
        const response = await restaurantUserService.checkCheckinStatus({
          user_id: nhostUser.id,
          restaurant_slug: restaurantSlug,
        });
        if (isMounted && response.success) {
          setCheckedIn(response.data.status === "checkedin");
        }
      } catch (err) {
        console.error("Failed to fetch check-in status:", err);
        if (isMounted) setError("Unable to fetch check-in status");
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    fetchCheckInStatus();
    return () => {
      isMounted = false;
    };
  }, [restaurantSlug, nhostUser, sessionLoading, initialized]);

  const handleToggle = useCallback(async () => {
    if (!nhostUser?.id) {
      setShowSignin(true);
      return;
    }

    setLoading(true);
    setError(null);
    const prevCheckedIn = checkedIn;
    setCheckedIn((prev) => !prev);
    window.dispatchEvent(
      new CustomEvent("restaurant-checkin-changed", {
        detail: { slug: restaurantSlug, status: !checkedIn },
      })
    );

    try {
      const response = await restaurantUserService.toggleCheckin({
        user_id: nhostUser.id,
        restaurant_slug: restaurantSlug,
      });

      if (response.success) {
        const isCheckedIn = response.data.status === "checkedin";
        toast.success(
          isCheckedIn ? checkInRestaurantSuccess : uncheckInRestaurantSuccess
        );
        setCheckedIn(isCheckedIn);
        window.dispatchEvent(
          new CustomEvent("restaurant-checkin-changed", {
            detail: { slug: restaurantSlug, status: isCheckedIn },
          })
        );
      } else {
        throw new Error(response.error || checkInStatusError);
      }
    } catch (err) {
      console.error("Error toggling check-in:", err);
      toast.error(checkInStatusError);
      setCheckedIn(prevCheckedIn);
      window.dispatchEvent(
        new CustomEvent("restaurant-checkin-changed", {
          detail: { slug: restaurantSlug, status: prevCheckedIn },
        })
      );
      setError(err instanceof Error ? err.message : checkInStatusError);
    } finally {
      setLoading(false);
    }
  }, [nhostUser, restaurantSlug, checkedIn]);

  // Unauthenticated state — show sign-in prompt on click
  if (!sessionLoading && !nhostUser) {
    return (
      <>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans"
          onClick={() => setShowSignin(true)}
        >
          <FiMapPin className="w-4 h-4 text-gray-500" />
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

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-normal text-sm font-neusans"
        aria-pressed={checkedIn}
      >
        {checkedIn ? (
          <FiMapPin className="w-4 h-4 text-orange-500" fill="currentColor" />
        ) : (
          <FiMapPin className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-sm font-normal">
          {checkedIn ? "Checked-in" : "Check-In"}
        </span>
        {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
      </button>
      {/* Auth modals triggered when unauthenticated user tries to act */}
      <SigninModal
        isOpen={showSignin}
        onClose={() => setShowSignin(false)}
        onOpenSignup={() => {
          setShowSignin(false);
          setShowSignup(true);
        }}
      />
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onOpenSignin={() => {
          setShowSignup(false);
          setShowSignin(true);
        }}
      />
    </>
  );
}
