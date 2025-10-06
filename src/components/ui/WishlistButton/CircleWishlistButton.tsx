import React from 'react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { WishlistButton } from './WishlistButton';

interface CircleWishlistButtonProps {
  restaurantSlug: string;
  initialSavedStatus?: boolean;
  onWishlistChange?: (isSaved: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CircleWishlistButton: React.FC<CircleWishlistButtonProps> = ({
  restaurantSlug,
  initialSavedStatus = false,
  onWishlistChange,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5'
  };

  return (
    <WishlistButton
      restaurantSlug={restaurantSlug}
      initialSavedStatus={initialSavedStatus}
      onWishlistChange={onWishlistChange}
      renderContent={({ saved, loading, toggleFavorite, isAuthenticated }) => (
        <button
          onClick={toggleFavorite}
          disabled={loading || !isAuthenticated}
          className={`rounded-full p-2 bg-white hover:bg-gray-50 transition-colors ${className}`}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          {loading ? (
            <span className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse block`} />
          ) : saved ? (
            <FaHeart className={`${sizeClasses[size]} text-[#E36B00]`} />
          ) : (
            <FaRegHeart className={sizeClasses[size]} />
          )}
        </button>
      )}
    />
  );
};
