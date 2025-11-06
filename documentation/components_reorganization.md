# Components Reorganization Plan

## Proposed Structure

```
components/
├── layout/              # Layout & navigation components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── BottomNav.tsx
│   ├── MobileTopBar.tsx
│   ├── MobileMenu.tsx
│   └── SidebarHeader.tsx
│
├── navigation/          # Navigation & location components
│   ├── LocationButton.tsx
│   ├── LocationModal.tsx
│   ├── LocationBottomSheet.tsx
│   └── NavbarSearchBar.tsx
│
├── restaurant/          # Restaurant-related components (enhanced)
│   ├── RestaurantCard.tsx (moved from root)
│   ├── Restaurant.tsx
│   ├── RestaurantReviews.tsx (moved from root)
│   ├── RestaurantReviewsModal.tsx (moved from root)
│   ├── CheckInRestaurantButton.tsx (moved from root)
│   ├── SuggestedRestaurants.tsx
│   ├── CommunityRecognitionSection.tsx
│   ├── RatingSection.tsx
│   ├── ImageGallery.tsx
│   ├── Details/
│   │   ├── RestaurantMap.tsx
│   │   ├── PhotoSlider.tsx
│   │   └── Photos.tsx
│   ├── Review/
│   │   ├── ReviewSubmission.tsx
│   │   ├── EditReviewSubmission.tsx
│   │   ├── Rating.tsx
│   │   └── RestaurantReviewHeader.tsx
│   └── Listing/
│       ├── Listing.tsx
│       ├── ListingCard.tsx
│       ├── DraftReviewCard.tsx
│       ├── AddListing.tsx
│       ├── AddListingClient.tsx
│       ├── ListingCardDraft.tsx
│       ├── ListingDraft.tsx
│       ├── ListingExplanation.tsx
│       └── ListingForm.tsx
│
├── review/              # Review-related components
│   ├── ReviewCard.tsx
│   ├── ReviewCard2.tsx
│   ├── ReviewBlock.tsx
│   ├── ReviewModal.tsx (moved from root)
│   ├── ReviewPopUpModal.tsx (moved from root)
│   ├── ReplyItem.tsx
│   ├── Reviews.tsx
│   ├── FollowingReviews.tsx
│   └── ClientOnlyReviews.tsx
│
├── profile/             # Profile components (keep existing structure)
│   ├── Profile.tsx
│   ├── ProfileHeader.tsx
│   ├── ProfileHeaderSkeleton.tsx
│   ├── Form.tsx
│   ├── ReviewsTab.tsx
│   ├── ListingsTab.tsx
│   ├── WishlistsTab.tsx
│   ├── CheckinsTab.tsx
│   ├── FollowersModal.tsx
│   └── FollowingModal.tsx
│
├── auth/                # Authentication components
│   ├── SigninModal.tsx
│   ├── SignupModal.tsx
│   ├── AuthModalWrapper.tsx
│   └── SessionWrapper.tsx
│
├── common/              # Common/shared components
│   ├── Pagination.tsx
│   ├── LoadingSpinner.tsx
│   ├── CustomDatepicker.tsx
│   ├── PhotoCropModal.tsx
│   ├── ModalPopup.tsx
│   ├── ModalPopup2.tsx
│   ├── SuggestedUsers.tsx
│   └── InactivityLogout.tsx
│
├── filter/              # Filter components (keep existing)
│   ├── Filter.tsx
│   ├── Filter2.tsx
│   ├── CuisineFilter.tsx
│   └── FilterSidebar.tsx
│
├── settings/            # Settings components (keep existing)
│   ├── Settings.tsx
│   ├── SettingsLayout.tsx
│   └── SettingsCategory.tsx
│
├── dashboard/           # Dashboard components (keep existing)
│   └── DashboardSidebar.tsx
│
├── ui/                  # UI primitives (keep existing structure)
│   ├── BottomSheet/
│   ├── Modal/
│   ├── Skeleton/
│   ├── Image/
│   ├── Toast/
│   ├── Select/
│   ├── Popover/
│   ├── Dropdown/
│   ├── WishlistButton/
│   ├── PalateTags/
│   ├── HashtagDisplay/
│   ├── HashtagInput/
│   ├── Options/
│   ├── TabContentGrid/
│   └── LoadingSpinner/
│
└── Hero.tsx             # Keep at root (main landing component)
```

## Migration Steps

1. Create new folder structure
2. Move components to new locations
3. Update all import statements
4. Remove duplicate/unused files
5. Test all imports work correctly

