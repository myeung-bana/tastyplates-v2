"use client";
import React from "react";

interface ReplySkeletonProps {
  count?: number;
}

const ReplySkeleton: React.FC<ReplySkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="reply-item animate-pulse" style={{ marginBottom: index < count - 1 ? '1.25rem' : '0' }}>
          <div className="reply-item__container">
            <div className="reply-item__avatar bg-gray-300 rounded-full flex-shrink-0" style={{ width: '32px', height: '32px' }} />
            <div className="reply-item__content">
              <div className="reply-item__header">
                <div className="reply-item__username bg-gray-300 rounded" style={{ width: '80px', height: '13px' }} />
                <div className="reply-item__like-btn">
                  <div className="bg-gray-300 rounded" style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
              <div className="reply-item__text bg-gray-200 rounded" style={{ width: '100%', height: '13px', marginTop: '0.5rem' }} />
              <div className="reply-item__text bg-gray-200 rounded" style={{ width: '75%', height: '13px', marginTop: '0.25rem' }} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ReplySkeleton;
