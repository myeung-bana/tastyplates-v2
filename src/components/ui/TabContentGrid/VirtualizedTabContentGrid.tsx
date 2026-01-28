import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedTabContentGridProps<T> {
  items: T[];
  loading: boolean;
  ItemComponent: React.ComponentType<{ restaurant: T; [key: string]: any }>;
  SkeletonComponent: React.ComponentType<{ key: string; skeletonKeyPrefix?: string }>;
  emptyMessage: string;
  emptyHeading?: string;
  itemProps?: Record<string, any>;
  skeletonKeyPrefix?: string;
  gridClassName?: string;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  estimatedRowHeight?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const VirtualizedTabContentGrid = <T extends { id: string | number }>({
  items,
  loading,
  ItemComponent,
  SkeletonComponent,
  emptyMessage,
  emptyHeading,
  itemProps = {},
  skeletonKeyPrefix = "skeleton",
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  estimatedRowHeight = 450,
  onLoadMore,
  hasMore = false
}: VirtualizedTabContentGridProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns.mobile);
  const [virtualizeReady, setVirtualizeReady] = useState(false);

  // Detect screen size for column count
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) {
        setColumnCount(columns.desktop);
      } else if (window.innerWidth >= 640) {
        setColumnCount(columns.tablet);
      } else {
        setColumnCount(columns.mobile);
      }
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns.mobile, columns.tablet, columns.desktop]);

  // Delay virtualization until DOM is fully ready (prevents ResizeObserver errors)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVirtualizeReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate rows for virtualization (items grouped by columns)
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < items.length; i += columnCount) {
      result.push(items.slice(i, i + columnCount));
    }
    return result;
  }, [items, columnCount]);

  // Virtual row estimator - Window scrolling (correct hook avoids observing `window` as an Element)
  const rowVirtualizer = useWindowVirtualizer({
    count: virtualizeReady ? rows.length : 0, // Only virtualize when DOM is ready
    estimateSize: () => estimatedRowHeight,
    overscan: 2,
    // scrollMargin tells virtualizer where the list starts relative to window top
    // getBoundingClientRect().top gives accurate position accounting for sticky headers
    scrollMargin: parentRef.current?.getBoundingClientRect().top ?? 0,
  });

  // Auto-load more when scrolling near the end
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;
    
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;
    
    const lastItem = virtualItems[virtualItems.length - 1];
    
    // Load more when we're within 3 rows of the end
    if (lastItem && lastItem.index >= rows.length - 3) {
      onLoadMore();
    }
  }, [rowVirtualizer.getVirtualItems(), onLoadMore, hasMore, loading, rows.length]);

  // Show loading skeleton for initial load or while virtualizer is initializing
  if ((loading && items.length === 0) || !virtualizeReady) {
    return (
      <div className={`${gridClassName} mt-10`}>
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonComponent key={`${skeletonKeyPrefix}-${i}`} skeletonKeyPrefix={skeletonKeyPrefix} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (items.length === 0 && !loading) {
    return (
      <div className="restaurants__no-results" style={{ gridColumn: '1 / -1', width: '100%' }}>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyHeading || 'No results found'}
          </h3>
          <p className="text-gray-500">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  // Render virtualized grid - Window Scrolling
  return (
    <>
      <div 
        ref={parentRef}
        className="mt-10"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowItems = rows[virtualRow.index];
            if (!rowItems) return null;
            
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={`${gridClassName} mb-4`}>
                  {rowItems.map((item) => (
                    <ItemComponent
                      key={item.id}
                      restaurant={item}
                      {...itemProps}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Loading indicator at bottom */}
        {loading && items.length > 0 && (
          <div className="py-6 flex justify-center">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-gray-500 animate-spin mr-2"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray="164"
                  strokeDashoffset="40"
                />
              </svg>
              <span className="text-gray-500 text-sm">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VirtualizedTabContentGrid;
