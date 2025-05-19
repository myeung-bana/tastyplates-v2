'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isSignedIn: boolean;
    setSignedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isSignedIn, setSignedIn] = useState(false);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const savedAuth = localStorage.getItem('isSignedIn');
        if (savedAuth) {
            setSignedIn(JSON.parse(savedAuth));
        }
    }, []);

    // Save auth state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('isSignedIn', JSON.stringify(isSignedIn));
    }, [isSignedIn]);

    return (
        <AuthContext.Provider value={{ isSignedIn, setSignedIn }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
