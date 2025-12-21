// app/profile/[username]/page.tsx
"use client";
import React from "react";
import Profile from "@/components/Profile/Profile";
import { useParams } from "next/navigation";

const UserProfilePage = () => {
    const params = useParams();
    const usernameParam = params ? params["username"] : undefined;
    
    // Extract username or userId - supports both username and UUID for backward compatibility
    let userIdentifier: string | undefined = undefined;

    if (usernameParam) {
        const identifierStr = Array.isArray(usernameParam) ? usernameParam[0] : usernameParam;
        if (identifierStr) {
            userIdentifier = identifierStr;
        }
    }

    if (!userIdentifier) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg text-gray-600">User profile not found or invalid identifier.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start justify-items-center min-h-screen gap-6 md:gap-8 font-inter mt-4 md:mt-20 text-[#31343F]">
            <Profile targetUserIdentifier={userIdentifier} />
        </div>
    );
};

export default UserProfilePage;
