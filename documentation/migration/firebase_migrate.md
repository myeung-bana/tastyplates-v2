# Firebase Authentication Migration Plan

## Overview
This document tracks the migration from NextAuth to Firebase Authentication across the codebase. All instances of `useSession` from `next-auth/react` need to be replaced with `useFirebaseSession` from `@/hooks/useFirebaseSession`.

## Migration Statistics
- **Total files to migrate**: 38 (excluding backup files)
- **Files using `status`**: 7
- **Files using `update`**: 3
- **Pages**: 5
- **Components**: 28
- **Hooks**: 5

---

## Migration Pattern

### Standard Replacement Pattern

1. **Replace import:**
   ```typescript
   // Before
   import { useSession } from "next-auth/react";
   
   // After
   import { useFirebaseSession } from "@/hooks/useFirebaseSession";
   ```

2. **Replace hook usage:**
   ```typescript
   // Before
   const { data: session } = useSession();
   const { data: session, status } = useSession();
   const { data: session, update } = useSession();
   
   // After
   const { user, firebaseUser, loading } = useFirebaseSession();
   ```

3. **Replace session checks:**
   ```typescript
   // Before
   if (!session) { ... }
   if (!session?.user) { ... }
   session?.user?.palates
   
   // After
   if (!user) { ... }
   if (!user) { ... }
   user?.palates
   ```

4. **Replace loading states:**
   ```typescript
   // Before
   if (status === 'loading') { ... }
   
   // After
   if (loading) { ... }
   ```

5. **Replace token usage:**
   ```typescript
   // Before
   session?.accessToken
   
   // After
   const idToken = await firebaseUser.getIdToken();
   ```

6. **Remove `update` usage:**
   - NextAuth's `update()` function is not available in Firebase
   - If session refresh is needed, refetch user data manually or reload the page

---

## Priority 1: Pages (App Routes)

### ✅ 1. `src/app/following/page.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, status } = useSession()`
- **Special**: Uses `status === 'loading'` for loading state
- **Changes**: Replaced with `useFirebaseSession`, using `loading` from hook. Updated sign-in redirect from `/api/auth/signin` to `/signin`.

### ✅ 2. `src/app/hashtag/[hashtag]/page.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to get Firebase ID token with `await firebaseUser.getIdToken()`.

### ✅ 3. `src/app/settings/account-security/profile/page.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, update } = useSession()`
- **Special**: Uses `update` to refresh session
- **Changes**: Replaced with `useFirebaseSession`. Removed `update()` call - session will refresh automatically. Updated `session?.user?.provider` to `user?.auth_method`. Updated token usage to Firebase ID token.

### ✅ 4. `src/app/settings/account-security/password/page.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.provider` to `user?.auth_method`. Updated token usage to Firebase ID token.

---

## Priority 2: Core Components (Restaurant-Related)

### ✅ 5. `src/components/Restaurant/Details/SaveRestaurantButton.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, status } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`, using `loading` from hook. Updated all `session?.user` to `user`.

### ✅ 6. `src/components/Restaurant/CheckInRestaurantButton.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, status } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`, using `loading` from hook. Updated all `session?.user` to `user`.

### ✅ 7. `src/components/Restaurant/RestaurantReviews.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`.

### ✅ 8. `src/components/Restaurant/RestaurantReviewsMobile.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`.

### ✅ 9. `src/components/Restaurant/RestaurantReviewsModal.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`.

### ✅ 10. `src/components/Restaurant/RestaurantReviewsViewerModal.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`.

### ✅ 11. `src/components/Restaurant/RatingSection.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.palates` to `user?.palates`.

### ✅ 12. `src/components/Restaurant/Review/ReviewSubmission.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`.

### ✅ 13. `src/components/Restaurant/Review/EditReviewSubmission.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token.

### ✅ 14. `src/components/Restaurant/Listing/Listing.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated all `session?.accessToken` to Firebase ID token.

### ✅ 15. `src/components/Restaurant/Listing/AddListing.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token.

### ✅ 16. `src/components/Restaurant/Listing/ListingDraft.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, status } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`, using `loading` from hook. Updated `status !== sessionStatus.authenticated` to `!userId`.

### ✅ 17. `src/components/Restaurant/Listing/ListingCardDraft.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token.

---

## Priority 3: Review Components

### ✅ 18. `src/components/review/ReviewCard.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.id` to `user?.id`.

### ✅ 19. `src/components/review/ReviewBlock.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`.

### ✅ 20. `src/components/review/ReviewPopUpModal.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`. Updated optimistic reply to use `user` data structure.

### ✅ 21. `src/components/review/SwipeableReviewViewer.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`.

### ✅ 22. `src/components/review/ReplyItem.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.id` to `user?.id`.

### ✅ 23. `src/components/ui/BottomSheet/ReviewBottomSheet.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated `session?.user?.id` to `user?.id`. Updated optimistic reply to use `user` data structure.

### ✅ 24. `src/components/review/CommentsBottomSheet.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated token usage to Firebase ID token. Updated optimistic reply to use `user` data structure.

---

## Priority 4: Profile and User Components

### ✅ 25. `src/components/Profile/Form.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, status: sessionStatus, update } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Removed `update()` call - session refreshes automatically. Updated all `session?.user` to `user`. Updated token usage to Firebase ID token.

### ✅ 26. `src/components/Profile/FollowingModal.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.id` to `user?.id`.

### ✅ 27. `src/components/Profile/FollowersModal.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.id` to `user?.id`.

---

## Priority 5: Onboarding Components

### ✅ 28. `src/components/onboarding/OnboardingStepOne.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated all `session?.user?.id` to `user?.id`.

### ✅ 29. `src/components/onboarding/OnboardingStepTwo.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session, update } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Removed `update()` call - session refreshes automatically. Updated all `session?.user?.id` to `user?.id`.

---

## Priority 6: Hooks

### ✅ 30. `src/hooks/useFollowData.ts`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated all `session?.accessToken` to Firebase ID token.

### ✅ 31. `src/hooks/useFollowingReviews.ts`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated all `session?.accessToken` to Firebase ID token.

### ✅ 32. `src/hooks/useWishlist.ts`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated all `session?.accessToken` to Firebase ID token. Updated `session?.user` to `user`.

---

## Priority 7: Utility Components

### ✅ 33. `src/components/common/ModalPopup2.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated all `session?.accessToken` to Firebase ID token.

### ✅ 34. `src/components/common/SuggestedUsers.tsx`
- **Status**: ✅ Completed
- **Uses**: `const { data: session } = useSession()`
- **Changes**: Replaced with `useFirebaseSession`. Updated `session?.user?.id` to `user?.id`.

---

## Special Considerations

### Files Using `status`
These files check `status === 'loading'` and need special handling:
- `src/app/following/page.tsx`
- `src/components/Restaurant/Details/SaveRestaurantButton.tsx`
- `src/components/Restaurant/CheckInRestaurantButton.tsx`
- `src/components/Restaurant/Listing/ListingDraft.tsx`

**Replacement pattern:**
```typescript
// Before
if (status === 'loading') { ... }

// After
if (loading) { ... }
```

### Files Using `update`
These files use NextAuth's `update()` function to refresh the session:
- `src/components/Profile/Form.tsx`
- `src/components/onboarding/OnboardingStepTwo.tsx`
- `src/app/settings/account-security/profile/page.tsx`

**Solution:**
- Remove `update` usage
- If session refresh is needed, manually refetch user data or reload the page
- Consider adding a `refetch` function to `useFirebaseSession` hook if needed

---

## Testing Checklist

After migrating each file, verify:
- [ ] Component/page loads without errors
- [ ] Authentication checks work correctly
- [ ] Loading states display properly
- [ ] Token-based API calls work (if applicable)
- [ ] User data is accessible when authenticated
- [ ] Sign-in prompts appear when not authenticated

---

## Migration Progress

- **Completed**: 34/38 files
  - ✅ Priority 1: 4/4 pages
  - ✅ Priority 2: 13/13 restaurant components
  - ✅ Priority 3: 7/7 review components
  - ✅ Priority 4: 3/3 profile components
  - ✅ Priority 5: 2/2 onboarding components
  - ✅ Priority 6: 3/3 hooks
  - ✅ Priority 7: 2/2 utility components
- **In Progress**: 0/38 files
- **Pending**: 4/38 files (backup files - can be ignored)

---

## Notes

- Backup files (`.backup` extension) should be ignored
- All migrations should maintain existing functionality
- Test thoroughly after each priority group
- Update this document as files are migrated
