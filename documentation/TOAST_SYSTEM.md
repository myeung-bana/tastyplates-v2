# Toast Notification System

This application uses a standardized toast notification system built on top of `react-hot-toast` with custom white pill-shape styling and fade animations.

## Features

- **White pill-shape design** with subtle shadows and borders
- **Fade in/out animations** instead of slide animations
- **Smaller font size** (14px) for better readability
- **Consistent positioning**: Top center for all screen sizes
- **Consistent styling** across all toast types
- **Custom animations** with smooth fade effects

## Usage

### Option 1: Use the Custom Toast Utility (Recommended)

```typescript
import customToast from '@/utils/toast';

// Success toast
customToast.success('Restaurant saved to wishlist!');

// Error toast
customToast.error('Failed to save restaurant');

// Loading toast
customToast.loading('Saving restaurant...');

// Info toast
customToast.info('Restaurant information updated');

// Promise toast
customToast.promise(
  saveRestaurant(),
  {
    loading: 'Saving restaurant...',
    success: 'Restaurant saved successfully!',
    error: 'Failed to save restaurant'
  }
);

// Dismiss toast
customToast.dismiss();
```

### Option 2: Use react-hot-toast directly

The global configuration in `layout.tsx` ensures consistent styling even when using `react-hot-toast` directly:

```typescript
import toast from 'react-hot-toast';

toast.success('Success message');
toast.error('Error message');
toast.loading('Loading message');
```

## Toast Types

### Success Toast
- **Background**: White (#ffffff)
- **Color**: Green (#10B981)
- **Duration**: 4 seconds
- **Icon**: Checkmark

### Error Toast
- **Background**: White (#ffffff)
- **Color**: Red (#EF4444)
- **Duration**: 5 seconds
- **Icon**: X mark

### Loading Toast
- **Background**: White (#ffffff)
- **Color**: Blue (#6366F1)
- **Duration**: Until dismissed
- **Icon**: Spinner

### Info Toast
- **Background**: White (#ffffff)
- **Color**: Blue (#6366F1)
- **Duration**: 4 seconds
- **Icon**: Info

## Styling

### Design Specifications
- **Shape**: Pill-shaped with 50px border radius
- **Background**: White (#ffffff)
- **Border**: Light gray (#E5E7EB)
- **Shadow**: Subtle drop shadow (0 4px 20px rgba(0, 0, 0, 0.15))
- **Padding**: 12px vertical, 24px horizontal
- **Font**: 14px, medium weight (500)
- **Max width**: 400px
- **Min width**: 200px

### Positioning
- **Position**: Top center for all screen sizes
- **Animation**: Fade in/out with subtle scale effect
- **Z-index**: 60 (above mobile top bar)

## Customization

To modify toast styling, update the `toastOptions` in `src/app/layout.tsx`:

```typescript
<Toaster 
  position="top-center"
  toastOptions={{
    style: {
      fontSize: '14px',        // Font size
      padding: '12px 24px',    // Padding
      borderRadius: '50px',    // Pill shape
      maxWidth: '400px',       // Max width
      minWidth: '200px',       // Min width
    },
    // ... other options
  }}
/>
```

## Animation Customization

To modify animations, update the CSS in `src/app/globals.css`:

```css
/* Fade in animation */
@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Fade out animation */
@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

## Migration Guide

To migrate existing toast calls to the new system:

1. **Replace direct toast imports**:
   ```typescript
   // Old
   import toast from 'react-hot-toast';
   
   // New
   import customToast from '@/utils/toast';
   ```

2. **Update toast calls**:
   ```typescript
   // Old
   toast.success('Message');
   
   // New
   customToast.success('Message');
   ```

3. **Remove custom styling** (if any):
   The new system handles all styling automatically.

## Examples

### Restaurant Check-in
```typescript
const handleCheckIn = async () => {
  try {
    await checkInRestaurant();
    customToast.success('Successfully checked in!');
  } catch (error) {
    customToast.error('Failed to check in');
  }
};
```

### Wishlist Toggle
```typescript
const handleWishlistToggle = async () => {
  const loadingToast = customToast.loading('Updating wishlist...');
  
  try {
    await toggleWishlist();
    customToast.dismiss(loadingToast);
    customToast.success(saved ? 'Removed from wishlist' : 'Added to wishlist');
  } catch (error) {
    customToast.dismiss(loadingToast);
    customToast.error('Failed to update wishlist');
  }
};
```

### Promise-based Operations
```typescript
const handleSave = () => {
  customToast.promise(
    saveRestaurantData(),
    {
      loading: 'Saving restaurant...',
      success: 'Restaurant saved successfully!',
      error: (err) => `Failed to save: ${err.message}`
    }
  );
};
```
