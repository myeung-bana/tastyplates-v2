# Tech Improvements for Mobile-App-Like Experience

## Overview
This document outlines improvements to transform TastyPlates into a mobile-app-like experience similar to redgifs.com, with gesture-based navigation, swipe interactions, and optimized performance.

## Current State Assessment

### ✅ Existing Capabilities
- **Turbopack**: Already enabled for fast development (`next dev --turbopack`)
- **PWA Support**: `next-pwa` configured for offline capability
- **Basic Animations**: `framer-motion` v12.7.3 installed
- **Touch Events**: Basic touch handling in `BottomSheet` component
- **Carousel**: `react-slick` v0.30.3 (outdated, but functional)

### ❌ Missing Features
- Advanced gesture libraries for swipe navigation
- Full-screen swipeable card browsing (Instagram/RedGifs style)
- Pull-to-refresh functionality
- Momentum scrolling optimizations
- Touch-action CSS optimizations
- React Native Web components for mobile feel
- Performance optimizations for mobile

---

## 1. Gesture & Swipe Libraries

### Recommended Dependencies

#### Primary: `@use-gesture/react` (Recommended)
```json
"@use-gesture/react": "^10.3.0"
```
**Why**: 
- Modern, performant gesture library
- Supports all touch gestures (swipe, pinch, drag, rotate)
- Works seamlessly with React and framer-motion
- Better performance than react-swipeable
- Active maintenance and community support

**Use Cases**:
- Swipe between restaurant cards (full-screen)
- Swipe between review posts
- Drag to refresh
- Pinch to zoom on images

#### Alternative: `react-swipeable` (Lighter Weight)
```json
"react-swipeable": "^7.0.1"
```
**Why**: 
- Simpler API for basic swipe gestures
- Smaller bundle size
- Good for simple left/right/up/down swipes

**Use Cases**:
- Simple card navigation
- Bottom sheet drag
- Swipe to dismiss modals

#### Advanced: `react-spring` (For Physics-Based Animations)
```json
"react-spring": "^9.7.3"
```
**Why**: 
- Physics-based animations (feels more native)
- Better performance than CSS transitions
- Works great with @use-gesture/react

**Use Cases**:
- Momentum scrolling
- Elastic bounce effects
- Smooth transitions between cards

---

## 2. Mobile App-Like Components

### 2.1 Full-Screen Swipeable Card Viewer

**Component**: `SwipeableCardViewer.tsx`
- Full-screen card interface (like Instagram Stories/RedGifs)
- Vertical swipe for next/previous card
- Horizontal swipe for navigation actions
- Pull-to-refresh at top
- Smooth transitions between cards
- Swipe indicators (dots or progress bar)

**Implementation Libraries**:
- `@use-gesture/react` for gesture detection
- `framer-motion` for animations
- Custom virtual scrolling for performance

**Target Pages**:
- `/restaurants` - Swipe through restaurant cards
- `/following` - Swipe through reviews
- `/profile/[userId]` - Swipe through user's reviews

### 2.2 Pull-to-Refresh Component

**Component**: `PullToRefresh.tsx`
- Native-like pull-to-refresh
- Animated refresh indicator
- Configurable refresh threshold
- Works with infinite scroll

**Implementation**:
```json
"react-pull-to-refresh": "^2.0.0"
```
Or custom implementation with `@use-gesture/react`

### 2.3 Bottom Sheet Enhancements

**Current**: Basic swipe-to-close exists
**Improvements Needed**:
- Momentum scrolling inside bottom sheet
- Better drag resistance
- Snap points (25%, 50%, 75%, 100%)
- Backdrop blur effect
- Keyboard avoidance

**Library**: Enhance existing `BottomSheet.tsx` with `@use-gesture/react`

### 2.4 Swipeable Image Gallery

**Component**: `SwipeableImageGallery.tsx`
- Full-screen image viewer
- Swipe left/right between images
- Pinch to zoom
- Double tap to zoom
- Swipe down to close

**Implementation**:
- `react-spring` for smooth transitions
- `@use-gesture/react` for gestures
- Replace/replace `react-slick` usage

---

## 3. Performance Optimizations

### 3.1 Image Optimization Beyond Next.js Image

**Current**: Using `next/image` (good, but can be enhanced)

**Additional Optimizations**:
- **Lazy Loading Enhancement**: Use Intersection Observer API
- **Image Preloading**: Preload next card's images
- **Progressive Image Loading**: Show blur placeholder → low-res → high-res
- **WebP/AVIF Support**: Ensure all images use modern formats

**Library**: 
```json
"react-lazy-load-image-component": "^1.6.0"
```

### 3.2 Virtual Scrolling

**Component**: `VirtualizedGrid.tsx` / `VirtualizedList.tsx`
- Render only visible items
- Smooth scrolling performance
- Better memory usage

**Library**:
```json
"react-window": "^1.8.10"
"react-virtual": "^2.10.4"
```

**Target Pages**:
- `/restaurants` - Virtualized restaurant grid
- `/following` - Virtualized review feed
- Profile tabs - Virtualized lists

### 3.3 Code Splitting & Lazy Loading

**Current**: Next.js handles basic code splitting
**Enhancements**:
- Route-based code splitting (already done)
- Component-level lazy loading for heavy components
- Dynamic imports for gesture libraries (load only on mobile)

**Implementation**:
```typescript
// Example: Lazy load gesture library only on mobile
const useGesture = typeof window !== 'undefined' && window.innerWidth < 768
  ? lazy(() => import('@use-gesture/react'))
  : null;
```

### 3.4 Service Worker Enhancements

**Current**: `next-pwa` configured
**Improvements**:
- Cache API responses
- Prefetch next card images
- Background sync for offline actions
- Push notifications (future)

---

## 4. Mobile-Specific Optimizations

### 4.1 Touch Action CSS

**Add to `globals.css`**:
```css
/* Prevent text selection during swipe */
.swipeable-card {
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* Optimize scrolling */
.scrollable-container {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

### 4.2 Viewport Meta Tag

**Ensure in `layout.tsx`**:
```html
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
```

### 4.3 Safe Area Insets

**Already implemented**: `safe-area-pb` class exists
**Enhancements**:
- Add safe area for top notches
- Handle safe area for swipe gestures
- Ensure bottom sheets respect safe areas

### 4.4 Momentum Scrolling

**CSS Enhancement**:
```css
.scroll-container {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
}
```

**JavaScript Enhancement**:
- Use `react-spring` for momentum-based animations
- Implement custom scroll physics

---

## 5. Missing Dependencies to Install

### Core Gesture Libraries
```bash
yarn add @use-gesture/react react-spring
```

### Performance Libraries
```bash
yarn add react-window react-lazy-load-image-component
```

### Mobile Optimization
```bash
yarn add react-intersection-observer
```

### Type Definitions
```bash
yarn add -D @types/react-window @types/react-lazy-load-image-component
```

### Optional: Advanced Features
```bash
# For pull-to-refresh
yarn add react-pull-to-refresh

# For better mobile detection
yarn add react-device-detect

# For haptic feedback (if supported)
yarn add react-native-haptic-feedback  # Requires additional setup
```

---

## 6. Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Install gesture libraries (`@use-gesture/react`, `react-spring`)
2. ✅ Add touch-action CSS optimizations
3. ✅ Enhance existing BottomSheet with better gestures
4. ✅ Implement pull-to-refresh on key pages

### Phase 2: Core Features (Week 3-4)
1. ✅ Create `SwipeableCardViewer` component
2. ✅ Implement swipe navigation on `/restaurants` page
3. ✅ Add swipeable image gallery
4. ✅ Virtual scrolling for performance

### Phase 3: Polish (Week 5-6)
1. ✅ Add momentum scrolling
2. ✅ Implement swipe indicators
3. ✅ Optimize animations
4. ✅ Add haptic feedback (if device supports)

### Phase 4: Advanced (Week 7-8)
1. ✅ Implement swipe gestures on all feed pages
2. ✅ Add swipe-to-archive/bookmark
3. ✅ Advanced gesture combinations
4. ✅ Performance monitoring and optimization

---

## 7. Alternative to Vite: Performance Improvements

Since migrating to Vite is not feasible (Next.js App Router), here are alternatives:

### 7.1 Turbopack (Already Enabled ✅)
- **Status**: Already using `next dev --turbopack`
- **Benefit**: Fastest Next.js development experience
- **Action**: Ensure production build optimization

### 7.2 Next.js Production Optimizations

**In `next.config.ts`**:
```typescript
const nextConfig: NextConfig = {
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
  
  // Experimental features for speed
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'framer-motion'],
  },
};
```

### 7.3 Bundle Size Optimization

**Implement**:
- Tree shaking (ensure proper ES module imports)
- Dynamic imports for heavy libraries
- Code splitting by route and feature
- Remove unused dependencies

**Tools**:
```bash
# Analyze bundle size
yarn add -D @next/bundle-analyzer
```

### 7.4 Runtime Performance

**Optimizations**:
- Use React.memo for expensive components
- Implement useMemo/useCallback where needed
- Virtual scrolling for long lists
- Image lazy loading and preloading
- Debounce/throttle scroll events

### 7.5 CDN & Caching

**Implement**:
- Static asset CDN
- Service Worker caching strategies
- API response caching
- Image CDN (Cloudinary, Imgix)

---

## 8. Code Examples

### 8.1 Swipeable Card Component Structure

```typescript
// SwipeableCardViewer.tsx
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

interface SwipeableCardViewerProps {
  items: Restaurant[] | Review[];
  onSwipeLeft?: (item: any) => void;
  onSwipeRight?: (item: any) => void;
  onSwipeUp?: (item: any) => void;
  onSwipeDown?: () => void;
}

export default function SwipeableCardViewer({ items, ... }: SwipeableCardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spring, api] = useSpring(() => ({ x: 0, y: 0, scale: 1 }));

  const bind = useGesture({
    onDrag: ({ offset: [x, y], direction: [dx, dy], velocity }) => {
      // Handle drag gesture
      api.start({ x, y, scale: 1 - Math.abs(y) / 1000 });
    },
    onDragEnd: ({ direction: [dx, dy], velocity, cancel }) => {
      // Handle swipe threshold
      if (Math.abs(dy) > 50 || velocity[1] > 0.5) {
        // Swipe detected - navigate to next/prev
      }
    },
  });

  return (
    <animated.div {...bind()} style={spring}>
      {/* Card content */}
    </animated.div>
  );
}
```

### 8.2 Pull-to-Refresh Implementation

```typescript
// PullToRefresh.tsx
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

export default function PullToRefresh({ onRefresh, children }) {
  const [spring, api] = useSpring(() => ({ y: 0 }));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bind = useGesture({
    onDrag: ({ offset: [_, y], direction: [__, dy] }) => {
      if (dy > 0 && window.scrollY === 0) {
        api.start({ y: Math.min(y, 80) });
      }
    },
    onDragEnd: ({ offset: [_, y], velocity }) => {
      if (y > 60 || velocity[1] > 0.5) {
        setIsRefreshing(true);
        onRefresh().finally(() => setIsRefreshing(false));
      }
      api.start({ y: 0 });
    },
  });

  return (
    <div {...bind()}>
      <animated.div style={{ transform: spring.y.to(y => `translateY(${y}px)`) }}>
        {isRefreshing && <RefreshIndicator />}
      </animated.div>
      {children}
    </div>
  );
}
```

---

## 9. Testing & Validation

### 9.1 Device Testing
- iOS Safari (iPhone 12+, iPad)
- Android Chrome (various devices)
- Test gesture responsiveness
- Test performance on low-end devices

### 9.2 Performance Metrics
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Cumulative Layout Shift (CLS) < 0.1

### 9.3 Gesture Testing
- Swipe velocity thresholds
- Swipe direction detection accuracy
- Multi-touch handling
- Gesture conflicts with scrolling

---

## 10. Migration Strategy

### Step 1: Install Dependencies
```bash
yarn add @use-gesture/react react-spring react-window react-intersection-observer
yarn add -D @types/react-window
```

### Step 2: Create Base Components
1. Create `SwipeableCardViewer.tsx`
2. Create `PullToRefresh.tsx`
3. Enhance `BottomSheet.tsx`
4. Create `SwipeableImageGallery.tsx`

### Step 3: Implement on Key Pages
1. `/restaurants` - Swipeable restaurant cards
2. `/following` - Swipeable review feed
3. `/profile/[userId]` - Swipeable user reviews
4. Image galleries - Swipeable image viewer

### Step 4: Performance Optimization
1. Add virtual scrolling
2. Implement lazy loading
3. Optimize bundle size
4. Add performance monitoring

---

## 11. Estimated Impact

### Performance Improvements
- **Bundle Size**: 10-15% reduction with tree shaking
- **Load Time**: 20-30% faster with optimizations
- **Interaction Response**: 60fps animations with react-spring
- **Memory Usage**: 30-40% reduction with virtual scrolling

### User Experience Improvements
- **Native Feel**: App-like gestures and animations
- **Engagement**: Higher time-on-site with swipe navigation
- **Mobile Optimization**: Better touch interactions
- **Performance**: Smoother scrolling and animations

---

## 12. Future Considerations

### Advanced Features (Post-MVP)
- Haptic feedback on gestures
- Voice commands
- Offline mode with sync
- Push notifications
- Background tasks
- Biometric authentication

### Progressive Web App Enhancements
- Install prompt
- App shortcuts
- Share target API
- File system access
- Background sync

---

## Conclusion

This roadmap provides a comprehensive plan to transform TastyPlates into a mobile-app-like experience. The focus is on:
1. **Gesture Libraries**: Modern, performant gesture handling
2. **Swipe Navigation**: Instagram/RedGifs-style card browsing
3. **Performance**: Virtual scrolling, lazy loading, optimizations
4. **Mobile Optimization**: Touch actions, safe areas, momentum scrolling

All improvements are compatible with Next.js and don't require migrating away from the current stack.

---

## Quick Start Checklist

- [ ] Install `@use-gesture/react` and `react-spring`
- [ ] Add touch-action CSS optimizations
- [ ] Create `SwipeableCardViewer` component
- [ ] Implement on `/restaurants` page
- [ ] Add virtual scrolling for performance
- [ ] Implement pull-to-refresh
- [ ] Enhance image gallery with swipe
- [ ] Test on iOS and Android devices
- [ ] Monitor performance metrics
- [ ] Iterate based on user feedback

