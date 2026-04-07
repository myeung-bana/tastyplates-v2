"use client";

import React, { useCallback, useState, useEffect } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { usePathname, useRouter } from "next/navigation";
import { useHaptic } from "@/hooks/useHaptic";

/** Routes with full-viewport `fixed` UI must not sit inside PTR: transform breaks `position:fixed`. */
const PULL_TO_REFRESH_BLOCKLIST = ["/profile/edit"] as const;

function isPullToRefreshBlockedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PULL_TO_REFRESH_BLOCKLIST.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

const Spinner = () => (
  <div className="flex justify-center py-3">
    <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#ff7c0a] animate-spin" />
  </div>
);

const PullToRefreshWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { trigger: haptic } = useHaptic();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 768;
      setEnabled(isMobile && !isPullToRefreshBlockedPath(pathname));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [pathname]);

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
