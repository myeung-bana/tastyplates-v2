// app/profile/[userId]/page.tsx
"use client";
import React from "react";
import Profile from "@/components/Profile/Profile";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

const UserProfilePage = () => {
    const params = useParams();
    const userIdParam = params ? params["userId"] : undefined;
    let parsedUserId: number | undefined = undefined;

    // Only support base64-encoded userId (e.g., dXNlcjoyNw==)
    if (userIdParam) {
        const userIdStr = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
        try {
            const decodedBase64 = atob(decodeURIComponent(userIdStr));
            // decodedBase64 should be like 'user:27'
            const match = decodedBase64.match(/user:(\d+)/);
            if (match) {
                parsedUserId = Number(match[1]);
            }
        } catch {
            // If not base64 or doesn't match, parsedUserId remains undefined
        }
    }

    const { data: session } = useSession();

    if (!parsedUserId || isNaN(parsedUserId)) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-600">User profile not found or invalid ID.</p>
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
