"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type FollowMap = { [authorId: number]: boolean };

interface FollowContextType {
  followMap: FollowMap;
  setFollowState: (authorId: number, isFollowing: boolean) => void;
  getFollowState: (authorId: number) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [followMap, setFollowMap] = useState<FollowMap>({});

  const setFollowState = useCallback((authorId: number, isFollowing: boolean) => {
    setFollowMap((prev) => ({ ...prev, [authorId]: isFollowing }));
  }, []);

  const getFollowState = useCallback((authorId: number) => {
    return !!followMap[authorId];
  }, [followMap]);

  return (
    <FollowContext.Provider value={{ followMap, setFollowState, getFollowState }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollowContext = () => {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollowContext must be used within a FollowProvider");
  return ctx;
};