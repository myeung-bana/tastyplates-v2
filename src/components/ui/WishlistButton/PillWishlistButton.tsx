import React from 'react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { WishlistButton } from './WishlistButton';

interface PillWishlistButtonProps {
  restaurantSlug: string;
  initialSavedStatus?: boolean;
  onWishlistChange?: (isSaved: boolean) => void;
  className?: string;
}

export const PillWishlistButton: React.FC<PillWishlistButtonProps> = ({
  restaurantSlug,
  initialSavedStatus = false,
  onWishlistChange,
  className = ''
}) => {
  return (
    <WishlistButton
      restaurantSlug={restaurantSlug}
      initialSavedStatus={initialSavedStatus}
      onWishlistChange={onWishlistChange}
      renderContent={({ saved, loading, toggleFavorite, isAuthenticated }) => (
        <button
          onClick={toggleFavorite}
          disabled={loading || !isAuthenticated}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors disabled:opacity-50 font-semibold text-sm ${className}`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : saved ? (
            <FaHeart className="text-red-500" />
          ) : (
            <FaRegHeart className="text-gray-500" />
          )}
          <span className="text-sm font-semibold">
            {saved ? "Saved" : "Save"}
          </span>
        </button>
      )}
    />
  );
};
