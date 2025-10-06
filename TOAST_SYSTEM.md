# Toast Notification System

This application uses a standardized toast notification system built on top of `react-hot-toast` with custom styling and animations.

## Features

- **Wider toasts** with better spacing for longer messages
- **Smaller font size** (14px) for better readability
- **Responsive positioning**: 
  - Desktop: Slides in from bottom center
  - Mobile: Slides in from top center
- **Consistent styling** across all toast types
- **Custom animations** with smooth slide-in/out effects

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
- **Color**: Green (#10B981)
- **Duration**: 4 seconds
- **Icon**: Checkmark

### Error Toast
- **Color**: Red (#EF4444)
- **Duration**: 5 seconds
- **Icon**: X mark

### Loading Toast
- **Color**: Blue (#6366F1)
- **Duration**: Until dismissed
- **Icon**: Spinner

### Info Toast
- **Color**: Blue (#6366F1)
- **Duration**: 4 seconds
- **Icon**: Info

## Styling

### Desktop (≥768px)
- Position: Bottom center
- Animation: Slide in from bottom
- Max width: 500px
- Min width: 300px

### Mobile (<768px)
- Position: Top center
- Animation: Slide in from top
- Max width: 500px
- Min width: 300px

## Customization

To modify toast styling, update the `toastOptions` in `src/app/layout.tsx`:

```typescript
<Toaster 
  position="bottom-center"
  toastOptions={{
    style: {
      fontSize: '14px',        // Font size
      padding: '12px 20px',   // Padding
      borderRadius: '8px',    // Border radius
      maxWidth: '500px',      // Max width
      minWidth: '300px',      // Min width
    },
    // ... other options
  }}
/>
```

## Animation Customization

To modify animations, update the CSS in `src/styles/global.scss`:

```scss
// Desktop animations
@keyframes slideInFromBottom {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

// Mobile animations
@keyframes slideInFromTop {
  from { transform: translateY(-100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
