# PWA Optimization — Haptic Feedback

## Overview

Site-wide haptic feedback has been implemented to give TastyPlates a native-app feel on mobile. The system uses the `web-haptics` package with a `navigator.vibrate()` fallback, exposed through a custom `useHaptic` hook at `src/hooks/useHaptic.ts`.

Haptics are no-ops on desktop browsers — zero performance impact when unsupported.

## Preset Reference

| Preset | Vibration | Use Case |
|---|---|---|
| `selection` | 5ms tick | Toggle state, tab switch, pill tap, picker-style interactions |
| `light` | 8ms tap | Navigation, opening panels/modals, card taps, secondary actions |
| `medium` | 15ms press | Closing/dismissing, cancel actions |
| `success` | 10-30-10ms double-pulse | Submit, apply, confirm, successful API actions |
| `warning` | 15-20-15ms nudge | Auth-gated prompts, destructive actions (logout) |
| `error` | 20-10-20-10-20ms triple-pulse | Failed API calls (reserved for toast-level errors) |

## Implementation Map

### Shared Button Component (`src/components/ui/button.tsx`)

The shared `Button` component auto-fires haptic feedback based on its `variant` prop:

- `primary` → `success`
- `secondary` → `light`
- `destructive` → `warning`
- `default` / `outline` / `ghost` / `link` → `selection`

Override with `haptic="medium"` or disable with `haptic={false}`. This cascades to every usage: review submission, auth forms, onboarding, settings, success pages.

### Mobile Top Bar (`src/components/layout/MobileTopBar.tsx`)

- Hamburger menu button → `light`
- Search icon button → `light`

### Bottom Navigation (`src/components/layout/BottomNav.tsx`)

- Every tab tap → `selection`
- Auth-gated tap (unauthenticated user) → `warning`

### Restaurant Card (`src/components/Restaurant/RestaurantCard.tsx`)

- Card image/title navigation → `light`
- Bookmark/save toggle → `selection` (or `warning` if auth-gated)
- Comments icon → `light`

### Review Card (`src/components/review/ReviewCard2.tsx`)

- Card click (open viewer) → `light`

### Check-In Button (`src/components/Restaurant/CheckInRestaurantButton.tsx`)

- Toggle check-in → `selection`
- Successful check-in/uncheck-in → `success`
- Unauthenticated click → `warning`

### Save Button (`src/components/Restaurant/Details/SaveRestaurantButton.tsx`)

- Toggle save → `selection`
- Successful save/unsave → `success`
- Unauthenticated click → `warning`

### Search Menu (`src/components/layout/SearchMenu.tsx`)

- Close button → `medium`
- Search mode toggle (Cuisine/Keyword) → `selection`
- Location selector → `light`
- Search submit → `success`
- Recent search pill tap → `selection`
- Clear recent searches → `medium`

### Restaurant Detail Page

**RestaurantHeader** (`src/components/Restaurant/Details/RestaurantHeader.tsx`):
- Share button → `light`

**OpeningHoursDisplay** (`src/components/Restaurant/Details/OpeningHoursDisplay.tsx`):
- Expand/collapse toggle → `selection`

### PWA Install Banner (`src/components/layout/PwaInstallBanner.tsx`)

- Install button → `success`
- Dismiss (X) button → `medium`

### Sidebar & Mobile Menu

**SidebarHeader** (`src/components/layout/SidebarHeader.tsx`):
- Navigation links → `light`
- Log out button → `warning`

**MobileMenu** (`src/components/layout/MobileMenu.tsx`):
- Close button → `medium`
- Navigation links → `light`
- Log In / Sign Up buttons → `light`

### Location Bottom Sheet (`src/components/navigation/LocationBottomSheet.tsx`)

- Country selection → `selection`
- City selection (confirm) → `success`
- Back to countries → `light`

### Auth Forms

**Login** (`src/pages/Login/Login.tsx`):
- Form submit (Continue) → `success`
- Google sign-in → `light`
- Password eye toggle → `selection`

**Register** (`src/pages/Register/Register.tsx`):
- Form submit (Continue) → `success`
- Google sign-up → `light`
- Password eye toggles → `selection`

### Filter Components (previously implemented)

**Filter2** (`src/components/Filter/Filter2.tsx`):
- Modal open → `light`
- Pill taps (price/rating/sort) → `selection`
- Apply filters → `success`
- Reset filters → `light`
- Cancel sort → `light`

**CuisineFilter** (`src/components/Filter/CuisineFilter.tsx`):
- Open → `light`
- Reset → `light`
- Apply → `success`

## Design Principles

1. **Confirm, don't annoy** — every user-initiated tap gets one pulse; passive state changes never fire.
2. **Match intent to intensity** — navigation is `light`, toggles are `selection`, confirms are `success`, auth gates are `warning`.
3. **No double-fire** — if a parent wires haptics, child components should not also fire (the shared `Button` handles its own; inline buttons handle theirs).
4. **Disabled buttons are silent** — the `Button` component has `disabled:pointer-events-none`, so haptics never fire on disabled state.
5. **Progressive enhancement** — `web-haptics` is lazily loaded on first trigger; falls back to Vibration API; no-ops gracefully on unsupported browsers.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useHaptic.ts` | Core hook (previously created) |
| `src/components/ui/button.tsx` | Auto-haptic by variant |
| `src/components/layout/MobileTopBar.tsx` | Menu + search |
| `src/components/layout/BottomNav.tsx` | Tab navigation |
| `src/components/layout/SearchMenu.tsx` | Full search flow |
| `src/components/layout/PwaInstallBanner.tsx` | Install + dismiss |
| `src/components/layout/SidebarHeader.tsx` | Nav items + logout |
| `src/components/layout/MobileMenu.tsx` | Nav items + auth buttons |
| `src/components/Restaurant/RestaurantCard.tsx` | Card + bookmark + comments |
| `src/components/review/ReviewCard2.tsx` | Card click |
| `src/components/Restaurant/CheckInRestaurantButton.tsx` | Toggle + auth |
| `src/components/Restaurant/Details/SaveRestaurantButton.tsx` | Toggle + auth |
| `src/components/Restaurant/Details/RestaurantHeader.tsx` | Share button |
| `src/components/Restaurant/Details/OpeningHoursDisplay.tsx` | Expand/collapse |
| `src/components/navigation/LocationBottomSheet.tsx` | Country/city selection |
| `src/pages/Login/Login.tsx` | Submit + Google + eye toggle |
| `src/pages/Register/Register.tsx` | Submit + Google + eye toggles |
| `src/components/Filter/Filter2.tsx` | All filter interactions (previously done) |
| `src/components/Filter/CuisineFilter.tsx` | Cuisine filter (previously done) |
