import React from "react";

interface ReviewBlockSkeletonProps {
  className?: string;
}

const ReviewBlockSkeleton: React.FC<ReviewBlockSkeletonProps> = ({ className = "" }) => {
  return (
    <div className={`review-block animate-pulse ${className}`}>
      {/* Header */}
      <div className="review-block__header">
        <div className="review-block__user">
          {/* User avatar - matches SCSS: 40px desktop, 32px mobile */}
          <div className="review-block__user-image bg-gray-300"></div>
          <div className="review-block__user-info">
            {/* Username - matches SCSS font sizes */}
            <div className="review-block__username bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="review-block__rating">
          {/* Rating stars - matches ReviewBlock's 16x16px stars */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="w-4 h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
          {/* Timestamp - matches ReviewBlock's formatted date */}
          <div className="review-block__timestamp bg-gray-300 rounded"></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="review-block__content">
        {/* Title - matches ReviewBlock's h3 with text-sm font-semibold */}
        <div className="h-4 w-full bg-gray-300 rounded mb-2"></div>
        {/* Review text - matches ReviewBlock's paragraph structure */}
        <div className="review-block__text bg-gray-300 rounded mb-1"></div>
        <div className="review-block__text bg-gray-300 rounded mb-1"></div>
        <div className="review-block__text bg-gray-300 rounded mb-2"></div>
        
        {/* Palate Tags Skeleton - matches PalateTags component */}
        <div className="review-block__palate-tags">
          <div className="review-block__palate-tag bg-gray-200 rounded-full w-full"></div>
          <div className="review-block__palate-tag bg-gray-200 rounded-full w-full"></div>
        </div>
      </div>
      
      {/* Images - matches ReviewBlock's image container */}
      <div className="review-block__image-container">
        {/* First image - matches SCSS: 100px desktop, 80px mobile */}
        <div className="review-block__image bg-gray-300"></div>
        {/* Second image - matches SCSS: 100px desktop, 80px mobile */}
        <div className="review-block__image bg-gray-300"></div>
      </div>
      
      {/* Actions - matches ReviewBlock's action buttons */}
      <div className="review-block__actions">
        {/* Like button - matches BiLike icon + count */}
        <div className="review-block__action-btn">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="h-4 w-full bg-gray-300 rounded"></div>
        </div>
        {/* View full review button */}
        <div className="review-block__action-btn">
          <div className="h-4 w-full bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default ReviewBlockSkeleton;
