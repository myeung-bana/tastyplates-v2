"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";

type AuthContextType = {
    token: string | null;
    setToken: (token: string | null) => void;
    signedIn: boolean;
    setSignedIn: (signedIn: boolean) => void;
    isSignedIn: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Initialize token from localStorage
    const [token, setTokenState] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("authToken");
        }
        return null;
    });
    const [signedIn, setSignedIn] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem("authToken");
        }
        return false;
    });

    // Update localStorage when token changes
    const setToken = (newToken: string | null) => {
        setTokenState(newToken);
        if (typeof window !== "undefined") {
            if (newToken) {
                localStorage.setItem("authToken", newToken);
            } else {
                localStorage.removeItem("authToken");
            }
        }
    };

    useEffect(() => {
        setSignedIn(!!token);
    }, [token]);

    const isSignedIn = useMemo(() => signedIn || !!token, [signedIn, token]);

    return (
        <AuthContext.Provider value={{ token, setToken, signedIn, setSignedIn, isSignedIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};