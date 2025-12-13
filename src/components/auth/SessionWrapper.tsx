"use client";

import { ReactNode } from "react";

/**
 * SessionWrapper - No longer needed with Firebase-only authentication
 * Firebase handles session management automatically via onAuthStateChanged
 * This component is kept for backward compatibility but just passes through children
 */
export default function SessionWrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
