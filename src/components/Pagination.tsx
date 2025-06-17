"use client";
import React from "react";

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  hasNextPage,
  onPageChange,
}) => {
  const totalPages = currentPage + (hasNextPage ? 1 : 0);
  const maxPagesToShow = 5;

  // Show pages 1 through 5 always
  const visiblePages = Array.from({ length: Math.min(maxPagesToShow, totalPages) }, (_, i) => i + 1);

  return (
    <div className="flex justify-center gap-2 mt-6 items-center">
      {/* Left arrow */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="text-3xl text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed px-3"
      >
        ‹
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`text-sm ${
            page === currentPage
              ? "text-gray-600 bg-gray-200 rounded-full px-4 py-2"
              : "text-black px-3 py-1"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Ellipsis if there are more than 5 pages */}
      {totalPages > maxPagesToShow && (
        <span className="px-2 text-gray-500">...</span>
      )}

      {/* Right arrow */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="text-3xl text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed px-3"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
