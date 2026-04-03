"use client";

import React, { useCallback, useState, useEffect } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { useRouter } from "next/navigation";
import { useHaptic } from "@/hooks/useHaptic";

const Spinner = () => (
  <div className="flex justify-center py-3">
    <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#ff7c0a] animate-spin" />
  </div>
);

const PullToRefreshWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { trigger: haptic } = useHaptic();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setEnabled(isMobile);

    const onResize = () => setEnabled(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleRefresh = useCallback(async () => {
    haptic("medium");
    router.refresh();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, [router, haptic]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullDownThreshold={60}
      maxPullDownDistance={85}
      resistance={2.5}
      backgroundColor="transparent"
      pullingContent={<Spinner />}
      refreshingContent={<Spinner />}
    >
      <>{children}</>
    </PullToRefresh>
  );
};

export default PullToRefreshWrapper;
