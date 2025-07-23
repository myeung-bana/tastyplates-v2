import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";
import toast from "react-hot-toast";
import CustomModal from "@/components/ui/Modal/Modal";
import { checkInStatusError, checkInRestaurantSuccess, uncheckInRestaurantSuccess } from "@/constants/messages";

export default function CheckInRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { data: session } = useSession();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const [showUncheckModal, setShowUncheckModal] = useState(false);

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

  const handleCheckIn = async () => {
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
      if (res.status == 200) {
        toast.success(checkInRestaurantSuccess);
        const data = await res.json();
        setCheckedIn(data.status === "checkedin");
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: data.status === "checkedin" } }));
      } else {
        toast.error(checkInStatusError);
        setCheckedIn(prevCheckedIn);
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
      }
      if (!res.ok) throw new Error(checkInStatusError);
    } catch (err) {
      toast.error(checkInStatusError);
      setCheckedIn(prevCheckedIn);
      window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
      setError(checkInStatusError);
    } finally {
      setLoading(false);
    }
  };

  const handleUncheckIn = async () => {
    setLoading(true);
    const prevCheckedIn = checkedIn;
    setCheckedIn(false);
    window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: false } }));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/checkin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken && { Authorization: `Bearer ${session?.accessToken}` }),
        },
        body: JSON.stringify({ restaurant_slug: restaurantSlug, action: "uncheckin" }),
        credentials: "include",
      });

      if (res.status === 200) {
        toast.success(uncheckInRestaurantSuccess);
        const data = await res.json();
        setCheckedIn(data.status === "checkedin");
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: data.status === "checkedin" } }));
      } else {
        toast.error(checkInStatusError);
        setCheckedIn(prevCheckedIn);
        window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
        throw new Error();
      }
    } catch {
      toast.error(checkInStatusError);
      setCheckedIn(prevCheckedIn);
      setError(checkInStatusError);
      window.dispatchEvent(new CustomEvent("restaurant-checkin-changed", { detail: { slug: restaurantSlug, status: prevCheckedIn } }));
    } finally {
      setLoading(false);
      setShowUncheckModal(false); // ✅ Always close modal here
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
      onClick={() => {
        if (checkedIn) {
          setShowUncheckModal(true);
        } else {
          handleCheckIn();
        }
      }}
      disabled={loading}
      aria-pressed={checkedIn}
    >
      <CustomModal
        isOpen={showUncheckModal}
        setIsOpen={setShowUncheckModal}
        header="Remove Check-In?"
        content={(
          <div className="text-center">
            <p className="text-sm text-[#494D5D]">
              {restaurantSlug} will be removed from your checked-in restaurants.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowUncheckModal(false)}
                className="flex-1 py-3 px-6 bg-[#FCFCFC] text-[#494D5D] rounded-xl border border-[#494D5D] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUncheckIn}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-[#E36B00] text-[#FCFCFC] rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin w-5 h-5 text-white"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray="164"
                      strokeDashoffset="40"
                    />
                  </svg>
                )} 
                Confirm
              </button>
            </div>
          </div>
        )}
        hasFooter
        headerClass="!text-[#31343F]"
        contentClass="!pb-[2px]"
      />
      <FaMapMarkerAlt className={checkedIn ? "text-primary" : undefined} />
      <span className={checkedIn ? "underline font-bold" : "underline"}>
        {checkedIn ? "Checked-in" : "Check-In"}
      </span>
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </button>
  );
}
