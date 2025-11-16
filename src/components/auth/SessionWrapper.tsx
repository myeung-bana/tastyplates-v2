"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function SessionWrapper({ children }: { children: ReactNode }) {
    return (
        <SessionProvider
            basePath="/api/auth"
            refetchInterval={0}
            refetchOnWindowFocus={true} // Enable to refetch after OAuth redirect
        >
            {children}
        </SessionProvider>
    );
}
