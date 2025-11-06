# Swipeable Review Viewer Documentation

## Overview

The Swipeable Review Viewer provides a full-screen, Instagram Reels-style experience for viewing reviews on mobile devices. Users can swipe vertically (up/down) to navigate between reviews, with smooth animations and a native app-like feel.

## Implementation Details

### Architecture

The implementation consists of three main components:

1. **SwipeableReviewViewer** - Main full-screen viewer component
2. **CommentsSlideIn** - Slide-in panel for comments
3. **ReviewCard2** - Updated to conditionally use the viewer on mobile

### Key Features

- **Vertical Swipe Navigation**: Swipe up to go to next review, swipe down to go to previous
- **Full-Screen Experience**: 100vh container with black background
- **Smooth Animations**: Physics-based animations using react-spring
- **Comments Panel**: Slide-in panel accessible via comments icon
- **Like Functionality**: Inline like/unlike with optimistic updates
- **Mobile-Only**: Desktop continues to use the existing modal experience

### Dependencies

- `@use-gesture/react@^10.3.1` - Gesture detection library
- `react-spring@^10.0.3` - Physics-based animation library

### Component Structure

```
SwipeableReviewViewer
├── Close Button (top-left)
├── Index Indicator (top-right)
├── Main Content (swipeable)
│   ├── Image Container
│   └── Content Overlay
│       ├── User Info
│       ├── Review Content
│       └── Action Buttons (Like, Comments)
└── CommentsSlideIn (conditional)
    ├── Header
    ├── Replies List
    └── Comment Input
```

## Usage

### Basic Implementation

```tsx
import SwipeableReviewViewer from "@/components/review/SwipeableReviewViewer";

<SwipeableReviewViewer
  reviews={reviewsArray}
  initialIndex={clickedIndex}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

### Integration with ReviewCard2

The `ReviewCard2` component automatically detects mobile devices and uses the appropriate viewer:

- **Mobile**: Opens `SwipeableReviewViewer`
- **Desktop**: Opens `ReviewPopUpModal` (existing behavior)

```tsx
<ReviewCard2
  data={reviewData}
  reviews={allReviewsArray}
  reviewIndex={index}
/>
```

## Gesture Handling

### Swipe Detection

- **Library**: `@use-gesture/react` `useDrag` hook
- **Axis**: Vertical only (`axis: "y"`)
- **Threshold**: 100px minimum distance OR 0.5 velocity for quick swipes
- **Direction**:
  - Swipe up (negative Y) → Next review
  - Swipe down (positive Y) → Previous review

### Animation

- **Library**: `react-spring` `useSpring` hook
- **Property**: `translateY` transform
- **Config**: `config.gentle` for smooth, natural movement
- **Reset**: Spring returns to 0 after gesture completes

## State Management

### SwipeableReviewViewer State

- `currentIndex`: Current review being displayed
- `userLiked`: Record of like states per review ID
- `likesCount`: Record of like counts per review ID
- `showComments`: Boolean for comments panel visibility

### CommentsSlideIn State

- `replies`: Array of comment replies
- `commentText`: Current comment input text
- `isLoading`: Comment submission loading state
- `cooldown`: Rate limiting cooldown timer

## Styling

### SCSS Files

- `_swipeable-review-viewer.scss` - Main viewer styles
- `_comments-slide-in.scss` - Comments panel styles

### Key CSS Properties

- `touch-action: pan-y` - Optimize vertical scrolling
- `user-select: none` - Prevent text selection during swipe
- `will-change: transform` - Optimize animation performance
- `env(safe-area-inset-*)` - Respect iOS safe areas

## Performance Optimizations

1. **Image Loading**: Uses Next.js Image component with optimization
2. **Memoization**: Review components are memoized where possible
3. **Gesture Debouncing**: Built into `@use-gesture/react`
4. **Spring Animation**: Hardware-accelerated transforms
5. **Body Scroll Lock**: Prevents background scrolling when viewer is open

## Mobile Detection

The implementation uses a custom `useIsMobile` hook:

```tsx
import { useIsMobile } from "@/utils/deviceUtils";

const isMobile = useIsMobile(); // Returns boolean
```

**Breakpoint**: 768px (matches Tailwind's `md` breakpoint)

## Edge Cases Handled

1. **First Review**: Swipe down does nothing (already at start)
2. **Last Review**: Swipe up does nothing (already at end)
3. **Empty Reviews Array**: Component returns null
4. **Missing Review Data**: Graceful fallbacks for missing fields
5. **Network Errors**: Toast notifications for user feedback

## Future Desktop Expansion

### Recommended Approach

1. **Horizontal Swipe Option**: Add horizontal swipe for desktop
2. **Keyboard Navigation**: 
   - Arrow Up/Down for navigation
   - Escape to close
   - Enter to open comments
3. **Mouse Drag Support**: Use `useDrag` with mouse events
4. **Split-Screen Layout**: Consider side-by-side view for desktop

### Implementation Notes

- Desktop expansion should be opt-in via feature flag
- Maintain backward compatibility with existing modal
- Consider different animation styles for desktop (less aggressive)
- Add hover states and tooltips for desktop interactions

## Testing Checklist

- [x] Vertical swipe navigation works smoothly
- [x] Swipe up/down transitions between reviews
- [x] Comments slide-in opens/closes correctly
- [x] Like functionality works in viewer
- [x] Close button and swipe-down dismiss work
- [x] Mobile-only behavior (desktop unchanged)
- [x] Works on homepage ReviewCard2 clicks
- [x] Works on /following page ReviewCard2 clicks
- [x] Edge cases (first/last review) handled
- [x] Performance is smooth (60fps animations)
- [x] Images load correctly
- [x] Safe area insets respected on iOS

## Known Limitations

1. **Single Image Display**: Currently shows only the first image from review
2. **No Image Gallery**: Multi-image reviews don't have horizontal swipe
3. **Comments Only**: Full review details (replies, etc.) are in comments panel
4. **No Pull-to-Refresh**: Future enhancement for refreshing review list

## Troubleshooting

### Gestures Not Working
- Check that `touch-action: pan-y` is applied
- Verify `@use-gesture/react` is properly installed
- Ensure container has proper dimensions

### Animations Not Smooth
- Check `react-spring` version compatibility
- Verify `will-change: transform` is applied
- Check for conflicting CSS transitions

### Comments Panel Not Opening
- Verify `CommentsSlideIn` is imported correctly
- Check z-index values (should be 10000+)
- Ensure backdrop click handler is working

## Related Files

- `src/components/review/SwipeableReviewViewer.tsx`
- `src/components/review/CommentsSlideIn.tsx`
- `src/components/review/ReviewCard2.tsx`
- `src/components/review/Reviews.tsx`
- `src/components/review/FollowingReviews.tsx`
- `src/utils/deviceUtils.ts`
- `src/styles/components/_swipeable-review-viewer.scss`
- `src/styles/components/_comments-slide-in.scss`

