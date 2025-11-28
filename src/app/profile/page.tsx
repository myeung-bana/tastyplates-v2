"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProfileHeaderSkeleton from "@/components/Profile/ProfileHeaderSkeleton";

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    
    if (!session || !session.user || !session.user.id) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    // Redirect to the user's profile with restaurant_users.id (UUID)
    // Use the UUID directly from Hasura
    const profileUrl = `/profile/${session.user.id}`;
    router.replace(profileUrl);
  }, [session, status, router]);

  // Show skeleton loading while redirecting
  return (
    <div className="flex flex-col items-start justify-items-center min-h-screen gap-6 md:gap-8 font-inter mt-4 md:mt-20 text-[#31343F]">
      <ProfileHeaderSkeleton />
    </div>
  );
};

export default ProfilePage;