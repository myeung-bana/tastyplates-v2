"use client";
import React from "react";

interface ReplySkeletonProps {
  count?: number;
}

const ReplySkeleton: React.FC<ReplySkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="space-y-2 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="h-3 bg-gray-300 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-3 bg-gray-300 rounded w-full mb-1" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-300 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ReplySkeleton;
