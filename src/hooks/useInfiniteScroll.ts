import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
  loading: boolean;
  threshold?: number;
}

export const useInfiniteScroll = ({
  loadMore,
  hasNextPage,
  loading,
  threshold = 1.0
}: UseInfiniteScrollProps) => {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !loading) {
          loadMore();
        }
      },
      { threshold }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, loading, loadMore, threshold]);

  return { observerRef };
};
