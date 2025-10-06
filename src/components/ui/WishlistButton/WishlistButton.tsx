import React from 'react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistButtonProps {
  restaurantSlug: string;
  initialSavedStatus?: boolean;
  onWishlistChange?: (isSaved: boolean) => void;
  className?: string;
  children?: React.ReactNode;
  renderContent?: (props: {
    saved: boolean;
    loading: boolean;
    error: string | null;
    toggleFavorite: () => void;
    isAuthenticated: boolean;
  }) => React.ReactNode;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  restaurantSlug,
  initialSavedStatus = false,
  onWishlistChange,
  className = '',
  children,
  renderContent
}) => {
  const { saved, loading, error, toggleFavorite, isAuthenticated } = useWishlist({
    restaurantSlug,
    initialSavedStatus,
    onWishlistChange
  });

  // If custom render function is provided, use it
  if (renderContent) {
    return (
      <>
        {renderContent({
          saved,
          loading,
          error,
          toggleFavorite,
          isAuthenticated
        })}
      </>
    );
  }

  // If children are provided, render them with the hook data
  if (children) {
    return (
      <div className={className} onClick={toggleFavorite}>
        {React.cloneElement(children as React.ReactElement, {
          saved,
          loading,
          error,
          toggleFavorite,
          isAuthenticated
        })}
      </div>
    );
  }

  // Default fallback (shouldn't be used in practice)
  return (
    <button
      onClick={toggleFavorite}
      disabled={loading || !isAuthenticated}
      className={className}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : saved ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart className="text-gray-500" />
      )}
    </button>
  );
};
