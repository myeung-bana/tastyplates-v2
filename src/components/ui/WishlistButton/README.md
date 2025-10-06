# Centralized Wishlist Components

This directory contains centralized wishlist functionality that can be used throughout the entire site.

## Components

### `useWishlist` Hook
The core hook that handles all wishlist logic:
- Authentication checks
- API calls to add/remove restaurants from wishlist
- State management (saved, loading, error states)
- Toast notifications
- Custom event dispatching for global state updates

### `WishlistButton` (Base Component)
A flexible base component that accepts custom render functions or children.

### `PillWishlistButton`
A pill-shaped button with text, designed for restaurant detail pages.

### `CircleWishlistButton`
A circular icon button, designed for restaurant cards and other compact layouts.

## Usage Examples

### Restaurant Detail Page
```tsx
import { PillWishlistButton } from '@/components/ui/WishlistButton';

<PillWishlistButton 
  restaurantSlug={restaurant.slug}
  initialSavedStatus={restaurant.isFavorite}
/>
```

### Restaurant Card
```tsx
import { CircleWishlistButton } from '@/components/ui/WishlistButton';

<CircleWishlistButton 
  restaurantSlug={restaurant.slug}
  initialSavedStatus={saved}
  onWishlistChange={(isSaved) => {
    setSaved(isSaved);
    onWishlistChange?.(restaurant, isSaved);
  }}
  size="sm"
/>
```

### Custom Implementation
```tsx
import { useWishlist } from '@/hooks/useWishlist';

const MyCustomButton = ({ restaurantSlug }) => {
  const { saved, loading, toggleFavorite } = useWishlist({
    restaurantSlug,
    initialSavedStatus: false
  });

  return (
    <button onClick={toggleFavorite} disabled={loading}>
      {saved ? '❤️' : '🤍'}
    </button>
  );
};
```

## Benefits

1. **Consistency**: Same behavior across all components
2. **Maintainability**: Single source of truth for wishlist logic
3. **Reusability**: Easy to add wishlist functionality anywhere
4. **Error Handling**: Centralized error management
5. **Testing**: Easier to test one implementation
6. **Performance**: Optimized API calls and state management
7. **Accessibility**: Consistent ARIA labels and keyboard navigation

## Migration

The old implementations in `restaurant/[slug]/page.tsx` and `RestaurantCard.tsx` have been replaced with these centralized components. All existing functionality is preserved while providing a cleaner, more maintainable codebase.
