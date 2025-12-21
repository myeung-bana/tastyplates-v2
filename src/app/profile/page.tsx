"use client";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProfileHeaderSkeleton from "@/components/ui/Skeleton/ProfileHeaderSkeleton";

const ProfilePage = () => {
  const { user, loading } = useFirebaseSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for session to load
    
    if (!user || !user.id) {
      // Redirect to login if not authenticated
      router.push("/");
      return;
    }

    // Redirect to the user's profile using username
    // Fallback to UUID if username is not available (for backward compatibility)
    if (user.username) {
      const profileUrl = `/profile/${encodeURIComponent(user.username)}`;
      router.replace(profileUrl);
    } else {
      // Fallback to UUID if username is not available
      const profileUrl = `/profile/${user.id}`;
      router.replace(profileUrl);
    }
  }, [user, loading, router]);

  // Show skeleton loading while redirecting
  return (
    <div className="flex flex-col items-start justify-items-center min-h-screen gap-6 md:gap-8 font-inter mt-4 md:mt-20 text-[#31343F]">
      <ProfileHeaderSkeleton />
    </div>
  );
};

export default ProfilePage;