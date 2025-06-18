import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";

export default function CheckInRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { data: session } = useSession();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!session || !restaurantSlug || initialized) return;
    fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/checkin/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
      },
      body: JSON.stringify({ restaurant_slug: restaurantSlug, action: "check" }),
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch check-in status");
        return res.json();
      })
      .then(data => {
        if (isMounted) setCheckedIn(data.status === "checkedin");
      })
      .finally(() => {
        if (isMounted) setInitialized(true);
      });
    return () => { isMounted = false; };
  }, [restaurantSlug, session]);

  const handleToggle = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const prevCheckedIn = checkedIn;
    setCheckedIn(prev => !prev);
    window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: !checkedIn } }));
    const action = checkedIn ? "uncheckin" : "checkin";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/checkin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
        },
        body: JSON.stringify({ restaurant_slug: restaurantSlug, action }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update check-in status");
      const data = await res.json();
      setCheckedIn(data.status === "checkedin");
      window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: data.status === "checkedin" } }));
    } catch (err) {
      setCheckedIn(prevCheckedIn);
      window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
      setError("Could not update check-in status");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <>
        <button
          className="restaurant-detail__review-button flex items-center gap-2"
          onClick={() => setShowSignup(true)}
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
      <span className="underline">{checkedIn ? "Checked-In" : "Check-In"}</span>
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </button>
  );
}
