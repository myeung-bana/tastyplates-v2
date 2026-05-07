"use client";
import { useAuthenticationStatus } from "@nhost/nextjs";
import { useNhostSession } from "@/hooks/useNhostSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProfileHeaderSkeleton from "@/components/ui/Skeleton/ProfileHeaderSkeleton";

const ProfilePage = () => {
  const { user, nhostUser, loading } = useNhostSession();
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (loading || authLoading) return;

    if (!isAuthenticated || !nhostUser?.id) {
      router.push("/");
      return;
    }

    // Prefer username from restaurant profile; fallback to Nhost id (UUID)
    const segment = user?.username
      ? encodeURIComponent(user.username)
      : user?.user_id
        ? encodeURIComponent(user.user_id)
        : encodeURIComponent(nhostUser.id);

    router.replace(`/profile/${segment}`);
  }, [user, loading, authLoading, isAuthenticated, nhostUser, router]);

  return (
    <div className="min-h-screen font-inter text-[#31343F]">
      <ProfileHeaderSkeleton />
    </div>
  );
};

export default ProfilePage;
