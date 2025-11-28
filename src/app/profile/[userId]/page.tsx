// app/profile/[userId]/page.tsx
"use client";
import React from "react";
import Profile from "@/components/Profile/Profile";
import { useParams } from "next/navigation";

const UserProfilePage = () => {
    const params = useParams();
    const userIdParam = params ? params["userId"] : undefined;
    
    // Extract userId - can be UUID (string) or legacy numeric ID
    let userId: string | undefined = undefined;

    if (userIdParam) {
        const userIdStr = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
        if (userIdStr) {
            userId = userIdStr;
        }
    }

    if (!userId) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-600">User profile not found or invalid ID.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start justify-items-center min-h-screen gap-6 md:gap-8 font-inter mt-4 md:mt-20 text-[#31343F]">
            <Profile targetUserId={userId} />
        </div>
    );
};

export default UserProfilePage;
