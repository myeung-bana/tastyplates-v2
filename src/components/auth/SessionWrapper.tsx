"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function SessionWrapper({ children }: { children: ReactNode }) {
    return (
        <SessionProvider
            basePath="/api/auth"
            refetchInterval={0}
            refetchOnWindowFocus={false} // Disable to prevent unnecessary fetches
        >
            {children}
        </SessionProvider>
    );
}
