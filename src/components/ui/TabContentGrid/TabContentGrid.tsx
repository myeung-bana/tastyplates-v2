import React from 'react';

interface TabContentGridProps<T> {
  items: T[];
  loading: boolean;
  ItemComponent: React.ComponentType<{ restaurant: T; [key: string]: any }>;
  SkeletonComponent: React.ComponentType<{ key: string }>;
  emptyMessage: string;
  itemProps?: Record<string, any>;
  skeletonKeyPrefix?: string;
}

const TabContentGrid = <T extends { id: string | number }>({
  items,
  loading,
  ItemComponent,
  SkeletonComponent,
  emptyMessage,
  itemProps = {},
  skeletonKeyPrefix = "skeleton"
}: TabContentGridProps<T>) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
        {loading && items.length === 0 ? (
          Array.from({ length: 8 }, (_, i) => (
            <SkeletonComponent key={`${skeletonKeyPrefix}-${i}`} />
          ))
        ) : items.length > 0 ? (
          items.map((item) => (
            <ItemComponent
              key={item.id}
              restaurant={item}
              {...itemProps}
            />
          ))
        ) : (
          !loading && (
            <div className="col-span-full text-center text-gray-400 py-12">
              {emptyMessage}
            </div>
          )
        )}
      </div>
      <div className="flex justify-center text-center mt-6 min-h-[40px]">
        {loading && items.length > 0 && (
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
        )}
      </div>
    </>
  );
};

export default TabContentGrid;
