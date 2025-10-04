"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { generateProfileUrl } from "@/lib/utils";

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

    // Redirect to the user's profile with direct user ID
    const profileUrl = generateProfileUrl(session.user.id);
    router.replace(profileUrl);
  }, [session, status, router]);

  // Show loading while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#31343F]">
      Loading user session...
    </div>
  );
};

export default ProfilePage;