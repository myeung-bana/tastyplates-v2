// app/profile/[userId]/page.tsx
"use client";
import React, { useEffect } from "react";
import Profile from "@/components/Profile/Profile";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const UserProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const userIdParam = params ? params["userId"] : undefined;
  const parsedUserId = userIdParam ? Number(userIdParam) : NaN;

  useEffect(() => {
    if (status === "authenticated" && !isNaN(parsedUserId) && parsedUserId === session?.user?.id) {
      router.replace("/profile");
    }
  }, [status, parsedUserId, session?.user?.id, router]);

  if (isNaN(parsedUserId)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">User profile not found or invalid ID.</p>
      </div>
    );
  }

  // While checking session/redirecting
  if (status === "loading" || (session?.user?.id && parsedUserId === session.user.id)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Redirecting to your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start justify-items-center min-h-screen gap-6 md:gap-16 font-inter mt-20 text-[#31343F]">
      <Profile targetUserId={parsedUserId} />
    </div>
  );
};

export default UserProfilePage;
