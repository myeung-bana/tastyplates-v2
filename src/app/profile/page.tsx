"use client";
import { useSession } from "next-auth/react";
import Footer from "@/components/Footer";
import Profile from "@/components/Profile/Profile";

const ProfilePage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#31343F]">
        Loading user session...
      </div>
    );
  }
  if (!session || !session.user || !session.user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#31343F]">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-start justify-items-center min-h-screen gap-6 md:gap-16 font-inter mt-20 text-[#31343F]">
        {/* Pass the logged-in user's ID as targetUserId */}
        <Profile targetUserId={session.user.id} />
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage;