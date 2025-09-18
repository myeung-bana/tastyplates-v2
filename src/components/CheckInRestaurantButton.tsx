import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";
import toast from "react-hot-toast";
import { checkInStatusError, checkInRestaurantSuccess, uncheckInRestaurantSuccess } from "@/constants/messages";
import { responseStatusCode as code } from "@/constants/response";
import { RestaurantService } from "@/services/restaurant/restaurantService";

const restaurantService = new RestaurantService();

export default function CheckInRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { data: session } = useSession();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  // Removed unused state

  useEffect(() => {
    let isMounted = true;
    if (!session || !restaurantSlug || initialized) return;
    const fetchCheckIn = async () => {
      try {
        const data = await restaurantService.createCheckIn(
          { restaurant_slug: restaurantSlug, action: "check" },
          session?.accessToken // can be undefined
        );

        if (isMounted) {
          setCheckedIn(data.status === "checkedin");
        }
      } catch (error) {
        console.error("Failed to fetch check-in status:", error);
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    fetchCheckIn();
    return () => { isMounted = false; };
  }, [restaurantSlug, session, initialized]);

  const handleToggle = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const prevCheckedIn = checkedIn;
    setCheckedIn(prev => !prev);
    window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: !checkedIn } }));
    const action = checkedIn ? "uncheckin" : "checkin";
    try {
      const res: Record<string, unknown> = await restaurantService.createCheckIn(
        { restaurant_slug: restaurantSlug, action },
        session?.accessToken,
        false
      );

      if (res.status == code.success) {
        toast.success(checkedIn ? uncheckInRestaurantSuccess : checkInRestaurantSuccess);
        const data = res as { status: string };
        setCheckedIn(data.status === "checkedin");
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: data.status === "checkedin" } }));
      } else {
        toast.error(checkInStatusError);
        setCheckedIn(prevCheckedIn);
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
      }
      if (!res.ok) throw new Error(checkInStatusError);
    } catch {
      toast.error(checkInStatusError);
      setCheckedIn(prevCheckedIn);
      window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
      setError(checkInStatusError);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <>
        <button
          className="restaurant-detail__review-button flex items-center gap-2"
          onClick={() => setShowSignin(true)}
        >
          <FaMapMarkerAlt />
          <span className="underline">Check-In</span>
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

  if (!initialized) {
    return (
      <button className="restaurant-detail__review-button flex items-center gap-2" disabled>
        <span className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
        <span className="underline text-gray-400">Loading…</span>
      </button>
    );
  }

  return (
    <button
      className="restaurant-detail__review-button flex items-center gap-2"
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={checkedIn}
    >
      <FaMapMarkerAlt className={checkedIn ? "text-primary" : undefined} />
      <span className={checkedIn ? "underline font-bold" : "underline"}>
        {checkedIn ? "Checked-in" : "Check-In"}
      </span>
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </button>
  );
}
