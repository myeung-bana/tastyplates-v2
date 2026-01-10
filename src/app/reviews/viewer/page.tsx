"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SwipeableReviewViewer from "@/components/review/SwipeableReviewViewer";
import { reviewV2Service } from "@/app/api/v1/services/reviewV2Service";
import { transformReviewV2ToGraphQLReview } from "@/utils/reviewTransformers";
import { GraphQLReview } from "@/types/graphql";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { buildReviewViewerUrl, ReviewViewerSource } from "@/utils/reviewViewerUrl";
import { HOME } from "@/constants/pages";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WINDOW_LIMIT = 3; // prev + current + next (when available)

function parseSource(searchParams: URLSearchParams): ReviewViewerSource | null {
  const src = (searchParams.get("src") || "").toLowerCase();
  if (src === "global") return { src: "global" };
  if (src === "following") return { src: "following" };
  if (src === "restaurant") {
    const restaurantUuid = searchParams.get("restaurantUuid") || "";
    if (!UUID_REGEX.test(restaurantUuid)) return null;
    return { src: "restaurant", restaurantUuid };
  }
  if (src === "user") {
    const userId = searchParams.get("userId") || "";
    const status = searchParams.get("status") || undefined;
    if (!UUID_REGEX.test(userId)) return null;
    return { src: "user", userId, status };
  }
  return null;
}

function ReviewsViewerContent() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { user } = useFirebaseSession();

  // Freeze initial params for the session so URL updates (offset changes) don't re-trigger full reload.
  const initialParamsRef = useRef<{
    source: ReviewViewerSource | null;
    offset: number;
    returnTo?: string;
  } | null>(null);

  if (!initialParamsRef.current && searchParamsHook) {
    const sp = new URLSearchParams(searchParamsHook.toString());
    const source = parseSource(sp);
    const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
    const returnTo = sp.get("returnTo") || undefined;
    initialParamsRef.current = { source, offset, returnTo };
  }

  const initial = initialParamsRef.current!;
  const source = initial.source;
  const returnTo = initial.returnTo;

  const viewerUserId = useMemo(() => {
    const id = user?.id ? String(user.id) : "";
    return UUID_REGEX.test(id) ? id : "";
  }, [user?.id]);

  const [centerOffset, setCenterOffset] = useState<number>(initial.offset);
  const [windowStart, setWindowStart] = useState<number>(0);
  const [windowIndex, setWindowIndex] = useState<number>(0);
  const [windowReviews, setWindowReviews] = useState<GraphQLReview[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { reviews: GraphQLReview[]; total: number }>>(new Map());

  const feedKey = useMemo(() => {
    if (!source) return "invalid";
    // following is personalized by current user
    if (source.src === "following") return `following:${viewerUserId || "anon"}`;
    if (source.src === "restaurant") return `restaurant:${source.restaurantUuid}`;
    if (source.src === "user") return `user:${source.userId}:${source.status || "all"}`;
    return "global";
  }, [source, viewerUserId]);

  const fetchWindow = useCallback(
    async (newCenterOffset: number) => {
      if (!source) return;

      const start = Math.max(0, newCenterOffset - 1);
      const limit = WINDOW_LIMIT;
      const cacheKey = `${feedKey}:start=${start}:limit=${limit}`;

      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        const idx = Math.min(Math.max(newCenterOffset - start, 0), Math.max(cached.reviews.length - 1, 0));
        setWindowStart(start);
        setWindowReviews(cached.reviews);
        setWindowIndex(idx);
        setTotal(cached.total);
        setLoading(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        let response;
        if (source.src === "global") {
          response = await reviewV2Service.getAllReviews({ limit, offset: start, signal: controller.signal });
        } else if (source.src === "restaurant") {
          response = await reviewV2Service.getReviewsByRestaurant(source.restaurantUuid, { limit, offset: start });
        } else if (source.src === "user") {
          response = await reviewV2Service.getUserReviews(source.userId, { limit, offset: start, status: source.status });
        } else {
          // following
          if (!viewerUserId) {
            setWindowReviews([]);
            setTotal(0);
            setLoading(false);
            return;
          }
          response = await reviewV2Service.getFollowingFeed({ userId: viewerUserId, limit, offset: start, signal: controller.signal });
        }

        const transformed = (response.reviews || []).map((r: any) => transformReviewV2ToGraphQLReview(r));
        const idx = Math.min(Math.max(newCenterOffset - start, 0), Math.max(transformed.length - 1, 0));

        cacheRef.current.set(cacheKey, { reviews: transformed, total: response.total || 0 });

        setWindowStart(start);
        setWindowReviews(transformed);
        setWindowIndex(idx);
        setTotal(response.total || 0);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setWindowReviews([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [feedKey, source, viewerUserId]
  );

  // Initial load when feed changes (source/user changes)
  useEffect(() => {
    setCenterOffset(initial.offset);
    cacheRef.current.clear();
    void fetchWindow(initial.offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedKey]);

  const closeViewer = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(returnTo || HOME);
  }, [router, returnTo]);

  const updateUrlOffset = useCallback(
    (newOffset: number) => {
      if (!source) return;
      const url = buildReviewViewerUrl({ ...(source as any), offset: newOffset, returnTo });
      router.replace(url, { scroll: false });
    },
    [router, source, returnTo]
  );

  const handleActiveIndexChange = useCallback(
    (localIdx: number) => {
      const abs = windowStart + localIdx;
      if (abs === centerOffset) return;

      setCenterOffset(abs);
      updateUrlOffset(abs);

      // If user swiped to an edge of the small window, re-center around the current item.
      const isEdge = localIdx === 0 || localIdx === windowReviews.length - 1;
      if (!isEdge) return;
      if (abs <= 0 || (total > 0 && abs >= total - 1)) return;
      void fetchWindow(abs);
    },
    [centerOffset, fetchWindow, total, updateUrlOffset, windowReviews.length, windowStart]
  );

  if (!source) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center font-neusans">
        <div className="text-center px-6">
          <p className="text-base mb-3">Invalid review viewer link.</p>
          <button
            className="px-4 py-2 rounded-full bg-white text-black"
            onClick={() => router.push(HOME)}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Following feed requires auth (viewerUserId)
  if (source.src === "following" && !viewerUserId) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center font-neusans">
        <div className="text-center px-6">
          <p className="text-base mb-2">Sign in to view your “For You” feed.</p>
          <p className="text-sm text-white/70 mb-4">This feed is personalized.</p>
          <button
            className="px-4 py-2 rounded-full bg-white text-black"
            onClick={closeViewer}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (loading && windowReviews.length === 0) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center font-neusans">
        <p className="text-sm text-white/80">Loading reviews…</p>
      </div>
    );
  }

  // Reuse existing viewer for look & feel. We keep the mounted list small and re-center as you swipe.
  return (
    <>
      <SwipeableReviewViewer
        reviews={windowReviews}
        initialIndex={windowIndex}
        isOpen={true}
        onClose={closeViewer}
        hasNextPage={false}
        onActiveIndexChange={handleActiveIndexChange}
      />

      {/* End-of-feed indicator */}
      {total > 0 && !loading && centerOffset >= total - 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10002]">
          <div className="px-4 py-2 rounded-full bg-black/70 text-white text-xs font-neusans border border-white/10">
            You’ve reached the end — no more posts.
          </div>
        </div>
      )}
    </>
  );
}

export default function ReviewsViewerPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center font-neusans">
        <p className="text-sm text-white/80">Loading reviews…</p>
      </div>
    }>
      <ReviewsViewerContent />
    </Suspense>
  );
}