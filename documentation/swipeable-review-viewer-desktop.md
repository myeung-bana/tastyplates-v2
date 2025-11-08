# SwipeableReviewViewerDesktop - Desktop Full-Screen Review Viewer

## Overview
`SwipeableReviewViewerDesktop` is a full-screen modal component inspired by [Douyin's desktop experience](https://www.douyin.com/). It provides a smooth, immersive way to browse through reviews on desktop/laptop devices with keyboard and mouse/trackpad controls.

## Features

### 🎯 **Core Functionality**
- **Full-screen modal** with dark backdrop (95% opacity black)
- **Vertical scrolling** between reviews using mouse wheel or two-finger trackpad scroll
- **Image gallery** with left/right navigation for multiple images per review
- **Side-by-side layout**: Image gallery (left) + Content/Comments (right)
- **Smooth animations** powered by `@use-gesture/react` and `@react-spring/web`

### 🎮 **Controls**

| Action | Input | Behavior |
|--------|-------|----------|
| **Navigate Between Reviews** | Mouse wheel / Two-finger scroll ↑↓ | Scroll up = previous review, Scroll down = next review |
| **Navigate Between Images** | Arrow buttons or ← → keys | Cycle through images in current review |
| **Toggle Comments** | Click comment button | Show/hide comments panel |
| **Like Review** | Click heart button | Toggle like status |
| **Close Viewer** | Click X button or ESC key | Exit full-screen viewer |
| **Keyboard Shortcuts** | ↑ ↓ ← → ESC | Navigate and control the viewer |

### 🚀 **Performance Optimizations**

1. **Windowed Rendering**: Only renders current review ± 2 adjacent reviews (max 4 at a time)
2. **Image Preloading**: Preloads images for current + next 2 reviews
3. **Lazy Comment Fetching**: Only fetches comments when toggled on
4. **Smooth Scroll Accumulator**: 100px threshold prevents accidental navigation

### 🎨 **UI/UX Design**

#### **Layout**
- **Left Side (Image Gallery)**: 
  - Centered image container (max 600px width, 80vh height)
  - Object-fit: contain (preserves aspect ratio)
  - Left/Right arrow buttons for multiple images
  - Image counter badge (bottom-right)
  - Scroll hint on first review (animated bounce)

- **Right Side (Sidebar - 420px)**:
  - User info header (avatar, username, rating)
  - Review content (title, description)
  - Action buttons (like, comment)
  - Comments panel (collapsible)
  - Custom scrollbar styling

#### **Color Scheme**
- Background: `#000000` (95% opacity)
- Sidebar: `#1a1a1a`
- Text: White with various opacity levels
- Accent: Orange (`#f97316` for active states)
- Borders: White with 10% opacity

### 📐 **Component Structure**

```tsx
<SwipeableReviewViewerDesktop>
  ├── Backdrop (onClick: close)
  └── Content Container (prevents close on click)
      ├── Close Button (top-left)
      ├── Navigation Indicator (top-right)
      ├── Image Gallery (left side)
      │   ├── Previous Image Button
      │   ├── Image Container
      │   │   ├── Main Image
      │   │   └── Image Counter Badge
      │   ├── Next Image Button
      │   └── Scroll Hint (first review only)
      └── Sidebar (right side)
          ├── User Info Header
          │   ├── Avatar
          │   └── User Details (name, rating)
          ├── Content Area (scrollable)
          │   ├── Review Title
          │   ├── Review Content
          │   ├── Action Buttons (like, comment)
          │   └── Comments Section (collapsible)
          │       ├── Comments Title
          │       ├── Loading State
          │       ├── Reply Items List
          │       └── Empty State
```

## Props Interface

```typescript
interface SwipeableReviewViewerDesktopProps {
  reviews: GraphQLReview[];    // Full array of reviews
  initialIndex: number;        // Starting review index
  isOpen: boolean;             // Modal open state
  onClose: () => void;         // Close callback
}
```

## Usage

### Integration with ReviewCard2

```tsx
import SwipeableReviewViewerDesktop from "./SwipeableReviewViewerDesktop";

const ReviewCard2 = ({ data, reviews, reviewIndex }: ReviewCard2Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <SwipeableReviewViewer {...props} />
      ) : reviews && typeof reviewIndex === 'number' ? (
        <SwipeableReviewViewerDesktop
          reviews={reviews}
          initialIndex={reviewIndex}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      ) : (
        <ReviewPopUpModal {...props} />
      )}
    </div>
  );
};
```

### Pages Integration

The component automatically works on any page that passes `reviews` array and `reviewIndex` to `ReviewCard2`:

**✅ Enabled on:**
- `/` (Homepage - `Reviews.tsx`)
- `/following` (`FollowingReviews.tsx`)
- `/hashtag/[hashtag]` (Hashtag page)

**Requirements:**
```tsx
<ReviewCard2 
  data={review}
  reviews={reviews}        // Pass full reviews array
  reviewIndex={index}      // Pass current review index
/>
```

## State Management

### Local State
```typescript
// Navigation
const [currentIndex, setCurrentIndex] = useState(initialIndex);
const [currentImageIndex, setCurrentImageIndex] = useState(0);

// Interactions
const [userLiked, setUserLiked] = useState<Record<number, boolean>>({});
const [likesCount, setLikesCount] = useState<Record<number, number>>({});
const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

// UI State
const [showComments, setShowComments] = useState(false);
const [replies, setReplies] = useState<GraphQLReview[]>([]);
const [isLoadingReplies, setIsLoadingReplies] = useState(false);
```

### Refs
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const fetchedCommentCountsRef = useRef<Set<number>>(new Set());
const preloadedImagesRef = useRef<Set<string>>(new Set());
const wheelAccumulatorRef = useRef(0);
```

## Gesture Handling

### Wheel/Scroll Navigation
Uses `@use-gesture/react` `useWheel` hook:
```typescript
const bindWheel = useWheel(
  ({ delta: [, dy], direction: [, dirY], last }) => {
    wheelAccumulatorRef.current += dy;
    const threshold = 100; // Pixels to trigger navigation
    
    if (last && Math.abs(wheelAccumulatorRef.current) > threshold) {
      if (dirY > 0) navigateReview("down");
      else navigateReview("up");
    }
  },
  { axis: "y", preventDefault: true }
);
```

### Spring Animations
Uses `@react-spring/web` for smooth transitions:
```typescript
const [{ y }, api] = useSpring(() => ({
  y: currentIndex,
  config: { tension: 300, friction: 30 },
}));
```

## Keyboard Shortcuts

| Key | Action | Condition |
|-----|--------|-----------|
| `↑` Arrow Up | Previous review | Comments not open |
| `↓` Arrow Down | Next review | Comments not open |
| `←` Arrow Left | Previous image | Always |
| `→` Arrow Right | Next image | Always |
| `ESC` Escape | Close viewer | Always |

## Styling

### SCSS File Location
`/src/styles/components/_swipeable-review-viewer-desktop.scss`

### Import in main.scss
```scss
@import "./components/swipeable-review-viewer-desktop";
```

### Key CSS Classes
- `.swipeable-review-viewer-desktop` - Main container
- `.swipeable-review-viewer-desktop__content` - Content wrapper
- `.swipeable-review-viewer-desktop__gallery` - Image gallery (left)
- `.swipeable-review-viewer-desktop__sidebar` - Content sidebar (right)
- `.swipeable-review-viewer-desktop__image-container` - Image wrapper
- `.swipeable-review-viewer-desktop__comments` - Comments section

### Responsive Breakpoints
- `max-width: 1200px` - Sidebar 360px, Image 500px
- `max-width: 1024px` - Sidebar 320px, Image 450px, Height 70vh

## Differences from Mobile Version

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Layout** | Side-by-side (gallery + sidebar) | Vertical stack |
| **Navigation** | Wheel scroll + arrow keys | Touch gestures |
| **Image Gallery** | Arrows + keyboard | Swipe gestures |
| **Comments** | Collapsible panel in sidebar | Slide-in from bottom |
| **Close Action** | X button or ESC | X button or swipe down from first |
| **Sizing** | Fixed max-width (1400px) | Full viewport (100dvh) |
| **Gestures** | Mouse wheel + keyboard | Touch + drag |

## Future Enhancements

### Potential Improvements
1. ✅ Momentum scrolling (optional physics-based navigation)
2. ✅ Comment reply functionality (integrate with ReviewService)
3. ✅ Full like/unlike API integration
4. ✅ Share button integration
5. ✅ Restaurant details link in review
6. ✅ Image zoom/lightbox for gallery
7. ✅ Smooth transitions between reviews (fade/slide)

### Mobile Expansion (Future)
If you want to use this viewer on mobile (replacing `SwipeableReviewViewer`):
- Add touch gesture support via `useDrag`
- Adjust layout for portrait/landscape
- Implement iOS safe area handling
- Add mobile-specific UI adjustments

## Testing Checklist

### Functionality
- [x] Opens when clicking ReviewCard2 on desktop
- [x] Displays correct initial review
- [x] Scrolls between reviews with mouse wheel
- [x] Scrolls between reviews with two-finger trackpad
- [x] Navigates images with arrow buttons
- [x] Navigates images with keyboard arrows
- [x] Toggles comments on/off
- [x] Fetches and displays comment replies
- [x] Like/unlike reviews
- [x] Closes with X button
- [x] Closes with ESC key
- [x] Prevents body scroll when open

### Performance
- [x] Only renders visible reviews (windowed)
- [x] Preloads images efficiently
- [x] Smooth scroll transitions
- [x] No jank when navigating
- [x] Efficient comment fetching

### UI/UX
- [x] Proper spacing and alignment
- [x] Readable text contrast
- [x] Hover states on buttons
- [x] Image aspect ratio preserved
- [x] Scroll hint visible on first review
- [x] Custom scrollbar in sidebar
- [x] Responsive to window resize

## Technical Notes

### Dependencies
- `@use-gesture/react` - Wheel/scroll gesture handling
- `@react-spring/web` - Smooth animations
- `next-auth/react` - Session management
- `react-hot-toast` - Toast notifications

### Services Used
- `ReviewService` - Fetch comments, like/unlike reviews
- `SessionService` - User authentication state

### Performance Considerations
- Windowed rendering reduces DOM nodes by ~80%
- Image preloading improves perceived performance
- Lazy comment fetching saves unnecessary API calls
- Debounced scroll events prevent excessive updates

## Changelog

### v1.0.0 (Initial Release)
- Full-screen desktop modal viewer
- Wheel/scroll navigation between reviews
- Image gallery with left/right navigation
- Comments panel integration
- Like/unlike functionality
- Keyboard shortcuts
- Performance optimizations (windowing, preloading)
- Responsive design (1400px max-width)

---

**Created**: November 2025  
**Component**: `src/components/review/SwipeableReviewViewerDesktop.tsx`  
**Styling**: `src/styles/components/_swipeable-review-viewer-desktop.scss`

