# TastyPlates - Product Specifications Document
## React Native Migration Baseline

**Version:** 1.0  
**Date:** 2024  
**Purpose:** Comprehensive product specification document for React Native mobile application migration

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Product Vision & Mission](#product-vision--mission)
3. [User Personas](#user-personas)
4. [Core Features & Functionality](#core-features--functionality)
5. [User Flows & Journeys](#user-flows--journeys)
6. [Data Models & Entities](#data-models--entities)
7. [Business Rules & Logic](#business-rules--logic)
8. [UI/UX Patterns](#uiux-patterns)
9. [Technical Architecture](#technical-architecture)
10. [API Specifications](#api-specifications)
11. [Feature Specifications](#feature-specifications)
12. [Migration Considerations](#migration-considerations)

---

## Product Overview

### What is TastyPlates?

**TastyPlates** is a social restaurant discovery and review platform that helps users find restaurants that match their taste preferences. The platform combines restaurant discovery, social networking, and personalized recommendations based on user palate preferences.

### Core Value Proposition

- **Personalized Discovery**: Find restaurants based on your palate preferences (e.g., "Dine like a Brazilian in Tokyo")
- **Social Reviews**: Share dining experiences with photos, ratings, and detailed reviews
- **Community-Driven**: Follow other food lovers and discover restaurants through their recommendations
- **Location-Based**: Find restaurants near you with distance-based search
- **Rich Content**: Multiple images per review, hashtags, mentions, and engagement features

### Key Differentiators

1. **Palate-Based Matching**: Users select palate preferences (cuisines/regions) to get personalized restaurant recommendations
2. **Social Feed**: Following feed shows reviews from users you follow
3. **Rich Review System**: Instagram-like review format with multiple images, hashtags, and engagement
4. **Restaurant Listing Creation**: Users can create restaurant listings (TastyStudio)
5. **Wishlist & Check-ins**: Save restaurants to wishlist and track visits

---

## Product Vision & Mission

### Vision
To become the go-to platform for discovering restaurants that match your unique taste preferences, connecting food lovers worldwide.

### Mission
Help people discover amazing food experiences by connecting them with restaurants and reviewers that share their palate preferences.

### Tagline
"Discover the meal that fits your taste. Dine like a Brazilian in Tokyo - or Korean in New York?"

---

## User Personas

### 1. The Food Explorer (Primary)
- **Age**: 25-45
- **Location**: Urban areas, frequent travelers
- **Goals**: Discover new restaurants, share experiences, find places matching their taste
- **Pain Points**: Overwhelming restaurant options, generic recommendations
- **Behaviors**: 
  - Actively searches for restaurants
  - Posts reviews with photos
  - Follows other food enthusiasts
  - Uses wishlist to plan future visits

### 2. The Social Foodie (Secondary)
- **Age**: 20-35
- **Location**: Urban/suburban
- **Goals**: Share dining experiences, build social presence, discover trending spots
- **Pain Points**: Finding authentic reviews, discovering hidden gems
- **Behaviors**:
  - Posts detailed reviews with multiple photos
  - Engages with other users (likes, comments)
  - Follows popular reviewers
  - Uses hashtags and mentions

### 3. The Casual Diner (Tertiary)
- **Age**: 30-50
- **Location**: Any
- **Goals**: Quick restaurant discovery, read reviews before dining
- **Pain Points**: Too many options, unreliable reviews
- **Behaviors**:
  - Primarily reads reviews
  - Uses search and filters
  - Occasionally posts reviews
  - Checks ratings and photos

### 4. The Restaurant Creator (Power User)
- **Age**: 25-40
- **Location**: Urban
- **Goals**: Create restaurant listings, manage reviews, build presence
- **Pain Points**: Managing multiple reviews, tracking engagement
- **Behaviors**:
  - Uses TastyStudio dashboard
  - Creates restaurant listings
  - Manages draft reviews
  - Tracks review statistics

---

## Core Features & Functionality

### 1. Authentication & Onboarding

#### Features
- **Email/Password Registration**: Traditional sign-up with email verification
- **Google OAuth**: One-click Google sign-in
- **Account Linking**: Automatic account linking by email to prevent duplicates
- **Onboarding Flow**: 2-step onboarding process
  - Step 1: Palate preferences selection
  - Step 2: Location preferences
- **Session Management**: Firebase-based session with automatic persistence

#### User Flow
```
New User → Sign Up (Email/Google) → Onboarding Step 1 (Palates) → Onboarding Step 2 (Location) → Home Feed
```

#### Business Rules
- New users must complete onboarding before accessing full features
- Onboarding can be skipped but preferences are set to defaults
- Users can update preferences later in settings
- Google OAuth users get automatic account creation

---

### 2. Restaurant Discovery

#### Features
- **Search**: 
  - Keyword search (restaurant name, address)
  - Cuisine/palate-based search
  - Location-based search
- **Filtering**:
  - By cuisine (multiple selection)
  - By palate (regions/cuisines)
  - By category (Fine Dining, Casual, etc.)
  - By price range ($, $$, $$$, $$$$)
  - By rating (min/max)
  - By location (radius search)
- **Sorting**:
  - By rating (highest/lowest)
  - By price
  - By distance (requires location)
  - By date (newest/oldest)
- **Display**:
  - Grid/list view
  - Restaurant cards with image, name, rating, price range
  - Pagination (infinite scroll)

#### User Flow
```
Home → Search/Filter → Restaurant List → Restaurant Detail → Reviews
```

#### Business Rules
- Palate-based search prioritizes restaurants with reviews from users with matching palates
- Location search requires user permission
- Default sort: Rating (if difference > 0.1 stars), then review count
- Search results cached for 10 minutes

---

### 3. Restaurant Detail Page

#### Features
- **Restaurant Information**:
  - Name, address, phone
  - Opening hours
  - Price range
  - Average rating and review count
  - Featured image and gallery
  - Map location
- **Reviews Section**:
  - All reviews for the restaurant
  - Filter by rating
  - Sort by date, rating, helpful
  - Review cards with images, ratings, content
- **Actions**:
  - Add to wishlist
  - Check-in
  - Write review
  - Share restaurant
- **Related Information**:
  - Cuisines, palates, categories
  - Branch locations (if applicable)
  - Menu URL (if available)

#### User Flow
```
Restaurant List → Restaurant Detail → View Reviews → Write Review / Add to Wishlist
```

#### Business Rules
- Only published restaurants are visible
- Reviews must be approved before appearing
- Users can only check-in once per restaurant
- Wishlist is user-specific

---

### 4. Review System

#### Features
- **Create Review**:
  - Title/headline
  - Content (text, markdown support)
  - Rating (0-5 stars, half-star increments)
  - Multiple images (upload from device or Google Photos)
  - Palate tags
  - Hashtags
  - Restaurant selection/linking
  - Save as draft
- **Edit Review**:
  - Update all fields
  - Add/remove images
  - Change rating
- **Delete Review**:
  - Soft delete (can be restored)
  - Confirmation required
- **Review Display**:
  - Review cards in feed
  - Full review detail view
  - Image gallery
  - Author information
  - Engagement metrics (likes, comments)
- **Engagement**:
  - Like/unlike reviews
  - Comment on reviews
  - Reply to comments (nested)
  - Share reviews

#### User Flow
```
Restaurant Detail / Profile → Create Review → Upload Images → Add Content → Publish / Save Draft
```

#### Business Rules
- Reviews require restaurant selection
- Minimum 1 image recommended
- Rating is required
- Reviews go through approval process (status: draft → pending → approved)
- Users can edit their own reviews
- Deleted reviews are soft-deleted (can be restored)

---

### 5. Social Features

#### Features
- **Follow System**:
  - Follow/unfollow users
  - View followers list
  - View following list
  - Follower/following counts
- **Following Feed**:
  - Personalized feed of reviews from followed users
  - Infinite scroll
  - Real-time updates
- **User Discovery**:
  - Suggested users (algorithm-based)
  - Search users by username
  - Browse popular reviewers
- **Engagement**:
  - Like reviews
  - Comment on reviews
  - Reply to comments
  - Share reviews

#### User Flow
```
Profile → Follow User → Following Feed → See Reviews from Followed Users
```

#### Business Rules
- Users can follow/unfollow at any time
- Following feed only shows approved reviews
- Suggested users based on:
  - Similar palate preferences
  - Popular reviewers
  - Users you might know
- Follow relationships are bidirectional (can see who follows whom)

---

### 6. User Profiles

#### Features
- **Profile Display**:
  - Profile image
  - Display name
  - Username
  - Bio
  - Location
  - Palate preferences
  - Statistics (reviews, followers, following, check-ins)
- **Profile Tabs**:
  - Reviews: All user reviews
  - Wishlist: Saved restaurants
  - Check-ins: Visited restaurants
  - Listings: Created restaurant listings (if applicable)
- **Profile Actions**:
  - Edit profile
  - Follow/unfollow
  - View followers/following
  - Share profile

#### User Flow
```
Navigation → Profile → View Tabs → Edit Profile / Follow User
```

#### Business Rules
- Usernames must be unique
- Profile images can be from Firebase or custom upload
- Users can view their own profile or others' profiles
- Profile statistics update in real-time

---

### 7. Wishlist & Check-ins

#### Features
- **Wishlist**:
  - Add restaurant to wishlist
  - Remove from wishlist
  - View wishlist
  - Filter/sort wishlist
- **Check-ins**:
  - Check-in to restaurant
  - Remove check-in
  - View check-in history
  - Check-in count per restaurant

#### User Flow
```
Restaurant Detail → Add to Wishlist / Check-in → Profile → View Wishlist/Check-ins
```

#### Business Rules
- Wishlist is user-specific
- Users can check-in multiple times (but UI shows as single check-in)
- Check-ins are timestamped
- Wishlist and check-ins are visible on user profile

---

### 8. TastyStudio (Content Creation)

#### Features
- **Dashboard**:
  - Review statistics (total, published, drafts)
  - Quick actions (create review, edit reviews)
  - Profile summary
- **Create Review**:
  - Multi-step form
  - Restaurant search/selection
  - Image upload
  - Content editor
  - Preview before publishing
- **Manage Reviews**:
  - View all reviews
  - Edit reviews
  - Delete reviews
  - View draft reviews
  - Publish drafts

#### User Flow
```
TastyStudio → Dashboard → Create Review / Edit Reviews → Publish
```

#### Business Rules
- Only authenticated users can access TastyStudio
- Reviews can be saved as drafts
- Drafts are private until published
- Published reviews go through approval process

---

### 9. Restaurant Listing Creation

#### Features
- **Create Restaurant**:
  - Restaurant name
  - Address (Google Places integration)
  - Phone, menu URL
  - Cuisines, palates, categories
  - Price range
  - Opening hours
  - Images
- **Restaurant Matching**:
  - Check for existing restaurants
  - Prevent duplicates
  - Link to existing restaurant if match found
- **Draft Listings**:
  - Save incomplete listings
  - Resume later
  - Delete drafts

#### User Flow
```
Listing → Step 1 (Basic Info) → Step 2 (Details) → Match Restaurant → Create / Link
```

#### Business Rules
- Restaurant matching by name and address
- Duplicate prevention
- New restaurants start as draft
- Restaurants must be published to appear in search

---

### 10. Search & Discovery

#### Features
- **Homepage Search**:
  - Hero search bar
  - Cuisine/palate selection modal
  - Keyword search toggle
  - Quick search suggestions
- **Restaurant Search**:
  - Advanced filters
  - Location-based search
  - Saved searches
- **User Search**:
  - Search by username
  - Browse users
- **Hashtag Search**:
  - Search by hashtag
  - View all reviews with hashtag

#### User Flow
```
Home → Search → Results → Filter → Select Restaurant / User / Hashtag
```

#### Business Rules
- Search results cached for performance
- Location search requires permission
- Hashtags are case-insensitive
- Search supports partial matches

---

## User Flows & Journeys

### Flow 1: New User Onboarding

```
1. User lands on homepage
2. Clicks "Sign Up"
3. Chooses Email/Password or Google OAuth
4. Completes registration
5. Redirected to Onboarding Step 1
6. Selects palate preferences (cuisines/regions)
7. Clicks "Next"
8. Onboarding Step 2: Sets location preferences
9. Clicks "Complete"
10. Redirected to home feed
11. Sees personalized restaurant recommendations
```

**Key Decisions:**
- User can skip onboarding (uses defaults)
- Preferences can be updated later
- Onboarding completion tracked in user profile

---

### Flow 2: Restaurant Discovery & Review

```
1. User searches for restaurants (keyword or palate)
2. Views restaurant list with filters applied
3. Clicks on restaurant card
4. Views restaurant detail page
5. Scrolls through reviews
6. Clicks "Write Review"
7. (If not logged in) Prompted to sign in
8. Selects restaurant (if not already selected)
9. Uploads images
10. Writes review content
11. Sets rating (0-5 stars)
12. Adds hashtags and palate tags
13. Clicks "Publish" or "Save Draft"
14. Review submitted (goes to approval if needed)
15. Returns to restaurant page
```

**Key Decisions:**
- Reviews require authentication
- Images are optional but recommended
- Rating is required
- Reviews can be saved as drafts

---

### Flow 3: Social Engagement

```
1. User views home feed (all reviews or following feed)
2. Scrolls through review cards
3. Clicks on review card
4. Views full review with images
5. Likes review
6. Reads comments
7. Adds comment
8. Clicks on author profile
9. Views author's reviews
10. Follows author
11. Returns to following feed
12. Sees new reviews from followed users
```

**Key Decisions:**
- Following feed only shows approved reviews
- Users can like/comment without following
- Comments support nested replies
- Engagement metrics update in real-time

---

### Flow 4: Profile Management

```
1. User navigates to profile
2. Views profile tabs (Reviews, Wishlist, Check-ins)
3. Clicks "Edit Profile"
4. Updates display name, bio, profile image
5. Saves changes
6. Views Reviews tab
7. Clicks on a review
8. Edits review
9. Updates content/images
10. Saves changes
11. Returns to profile
```

**Key Decisions:**
- Users can only edit their own profile
- Profile changes are immediate
- Review edits maintain original publish date
- Profile image can be from Firebase or custom upload

---

### Flow 5: Restaurant Wishlist & Check-in

```
1. User views restaurant detail page
2. Clicks "Add to Wishlist" button
3. Restaurant added to wishlist
4. User visits restaurant
5. Returns to app
6. Clicks "Check-in" button
7. Check-in recorded
8. Navigates to profile
9. Views Wishlist tab
10. Sees saved restaurants
11. Views Check-ins tab
12. Sees visited restaurants
```

**Key Decisions:**
- Wishlist and check-ins are separate features
- Users can have both wishlist and check-in for same restaurant
- Check-ins are timestamped
- Wishlist can be filtered/sorted

---

### Flow 6: TastyStudio Content Creation

```
1. User navigates to TastyStudio dashboard
2. Views review statistics
3. Clicks "Create Review"
4. Searches for restaurant (or creates new)
5. Selects restaurant
6. Uploads images
7. Writes review content
8. Sets rating
9. Adds hashtags
10. Saves as draft
11. Returns to dashboard
12. Views "Edit Reviews"
13. Selects draft review
14. Completes review
15. Publishes review
16. Review goes to approval queue
```

**Key Decisions:**
- Reviews can be created from TastyStudio or restaurant page
- Drafts are private until published
- Published reviews require approval
- Users can manage all their reviews from dashboard

---

## Data Models & Entities

### 1. User (restaurant_users)

```typescript
interface User {
  id: UUID;
  firebase_uuid: string;
  username: string;
  email: string;
  display_name: string;
  profile_image: {
    url: string;
    alt_text?: string;
  };
  bio?: string;
  palates: string[]; // ["Italian", "Japanese", "Korean"]
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onboarding_complete: boolean;
  auth_method: "email" | "google";
  created_at: DateTime;
  updated_at: DateTime;
  deleted_at?: DateTime;
}
```

**Relationships:**
- Has many reviews (restaurant_reviews)
- Has many followers (restaurant_user_follows)
- Has many following (restaurant_user_follows)
- Has many favorites (user_favorites)
- Has many check-ins (user_checkins)

---

### 2. Restaurant (restaurants)

```typescript
interface Restaurant {
  id: number;
  uuid: UUID;
  title: string;
  slug: string;
  status: "publish" | "draft" | "private";
  content?: string;
  listing_street: string;
  address: {
    place_id?: string;
    formatted_address: string;
    // ... Google Places data
  };
  latitude?: number;
  longitude?: number;
  phone?: string;
  menu_url?: string;
  featured_image_url?: string;
  uploaded_images: Image[];
  opening_hours?: OpeningHours;
  price_range_id: number;
  average_rating: number;
  ratings_count: number;
  cuisines: TaxonomyItem[];
  palates: TaxonomyItem[];
  categories: TaxonomyItem[];
  is_main_location: boolean;
  branch_group_id?: UUID;
  created_at: DateTime;
  updated_at: DateTime;
  published_at?: DateTime;
}
```

**Relationships:**
- Has many reviews (restaurant_reviews)
- Has many favorites (user_favorites)
- Has many check-ins (user_checkins)
- Belongs to price range (restaurant_price_ranges)
- Can have branches (via branch_group_id)

---

### 3. Review (restaurant_reviews)

```typescript
interface Review {
  id: UUID;
  restaurant_uuid: UUID;
  author_id: UUID;
  parent_review_id?: UUID; // For comments/replies
  title?: string;
  content: string;
  rating: number; // 0-5, half increments
  images: Image[];
  palates: string[];
  hashtags: string[];
  mentions: Mention[];
  recognitions: string[];
  likes_count: number;
  replies_count: number;
  views_count: number;
  status: "draft" | "pending" | "approved" | "rejected" | "hidden";
  is_pinned: boolean;
  is_featured: boolean;
  created_at: DateTime;
  updated_at: DateTime;
  published_at?: DateTime;
  deleted_at?: DateTime;
}
```

**Relationships:**
- Belongs to restaurant (restaurants)
- Belongs to author (restaurant_users)
- Has parent (for nested comments)
- Has many likes (restaurant_review_likes)
- Has many replies (restaurant_reviews via parent_review_id)

---

### 4. Follow Relationship (restaurant_user_follows)

```typescript
interface Follow {
  id: UUID;
  follower_id: UUID; // User who follows
  user_id: UUID; // User being followed
  created_at: DateTime;
}
```

**Relationships:**
- Follower belongs to user (restaurant_users)
- User belongs to user (restaurant_users)

---

### 5. Favorite/Wishlist (user_favorites)

```typescript
interface Favorite {
  id: UUID;
  user_id: UUID;
  restaurant_uuid: UUID;
  created_at: DateTime;
}
```

**Relationships:**
- Belongs to user (restaurant_users)
- Belongs to restaurant (restaurants)

---

### 6. Check-in (user_checkins)

```typescript
interface CheckIn {
  id: UUID;
  user_id: UUID;
  restaurant_uuid: UUID;
  checked_in_at: DateTime;
}
```

**Relationships:**
- Belongs to user (restaurant_users)
- Belongs to restaurant (restaurants)

---

### 7. Review Like (restaurant_review_likes)

```typescript
interface ReviewLike {
  id: UUID;
  review_id: UUID;
  user_id: UUID;
  created_at: DateTime;
}
```

**Relationships:**
- Belongs to review (restaurant_reviews)
- Belongs to user (restaurant_users)

---

### 8. Taxonomy (Categories, Cuisines, Palates)

```typescript
interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
  display_name?: string;
  parent_id?: number; // For hierarchical taxonomies
  description?: string;
  image_url?: string;
}
```

**Types:**
- Categories: Restaurant categories (Fine Dining, Casual, etc.)
- Cuisines: Cuisine types (Italian, Japanese, etc.)
- Palates: Taste preferences (regions/cuisines)

---

## Business Rules & Logic

### Authentication Rules

1. **User Registration**:
   - Email must be unique
   - Username must be unique
   - Password must meet security requirements
   - Google OAuth users get automatic account creation

2. **Session Management**:
   - Sessions persist across app restarts
   - Inactive sessions expire after 30 days
   - Users can have only one active session per device

3. **Onboarding**:
   - New users must complete onboarding (can be skipped)
   - Onboarding preferences can be updated later
   - Onboarding completion tracked in user profile

---

### Restaurant Rules

1. **Restaurant Creation**:
   - Users can create restaurant listings
   - Duplicate prevention by name and address
   - New restaurants start as draft
   - Must be published to appear in search

2. **Restaurant Display**:
   - Only published restaurants visible to public
   - Draft restaurants visible only to creator
   - Average rating calculated from approved reviews only
   - Rating updates when new reviews are approved

3. **Restaurant Matching**:
   - Matching by name similarity and address proximity
   - Users can link review to existing restaurant
   - Prevents duplicate restaurant entries

---

### Review Rules

1. **Review Creation**:
   - Must be authenticated
   - Must select restaurant
   - Rating is required (0-5 stars)
   - Content is required
   - Images are optional but recommended
   - Can save as draft

2. **Review Status**:
   - New reviews start as "draft" or "pending"
   - "Pending" reviews require approval
   - "Approved" reviews appear publicly
   - "Rejected" reviews are hidden
   - "Hidden" reviews are soft-deleted

3. **Review Moderation**:
   - Reviews go through approval process
   - Automated checks for spam/inappropriate content
   - Manual moderation for edge cases
   - Users notified of approval/rejection

4. **Review Engagement**:
   - Users can like reviews
   - Users can comment on reviews
   - Comments support nested replies
   - Like/comment counts update in real-time
   - Users can edit their own reviews
   - Users can delete their own reviews (soft delete)

---

### Social Rules

1. **Follow System**:
   - Users can follow/unfollow at any time
   - Follow relationships are bidirectional (can see followers/following)
   - Following feed shows only approved reviews
   - Suggested users based on palate similarity and popularity

2. **Engagement**:
   - Users can like any review
   - Users can comment on any review
   - Comments are public
   - Users can delete their own comments

---

### Wishlist & Check-in Rules

1. **Wishlist**:
   - Users can add/remove restaurants from wishlist
   - Wishlist is user-specific
   - No limit on wishlist size
   - Wishlist visible on user profile

2. **Check-ins**:
   - Users can check-in to restaurants
   - Check-ins are timestamped
   - Users can remove check-ins
   - Check-in count visible on restaurant page
   - Check-ins visible on user profile

---

### Search & Discovery Rules

1. **Search**:
   - Search results cached for 10 minutes
   - Location search requires user permission
   - Palate-based search prioritizes matching palate reviews
   - Search supports partial matches

2. **Filtering**:
   - Multiple filters can be applied simultaneously
   - Filters persist in URL
   - Default filters applied if none selected

3. **Sorting**:
   - Default sort: Rating (if difference > 0.1), then review count
   - Palate-based sort: Matching palate rating, then overall rating
   - Manual sort overrides default

---

## UI/UX Patterns

### Navigation Structure

#### Desktop Navigation
- **Top Navbar**: Logo, Search, Navigation Links, User Menu
- **Sidebar**: (On some pages) Filters, Categories
- **Footer**: Links, Legal, Social

#### Mobile Navigation
- **Top Bar**: Logo, Search, Menu
- **Bottom Navigation**: Home, Discover, Following, Profile
- **Drawer Menu**: Settings, TastyStudio, Legal

---

### Component Patterns

#### 1. Review Cards
- **Grid View**: Image, rating, author, restaurant name
- **List View**: Full review with images, content preview
- **Detail View**: Full review with all images, comments, engagement

#### 2. Restaurant Cards
- **Standard Card**: Image, name, rating, price range, location
- **Featured Card**: Larger image, more details
- **Compact Card**: Minimal info for lists

#### 3. Search & Filters
- **Hero Search**: Large search bar on homepage
- **Filter Sidebar**: Collapsible filters on restaurant list
- **Filter Modal**: Full-screen filter on mobile

#### 4. Modals & Overlays
- **Auth Modals**: Sign in/Sign up overlays
- **Image Modals**: Full-screen image viewer
- **Review Modals**: Create/edit review overlays
- **Confirmation Modals**: Delete/action confirmations

---

### Interaction Patterns

#### 1. Infinite Scroll
- Used in: Review feeds, Restaurant lists, User lists
- Loading states: Skeleton loaders
- End state: "No more items" message

#### 2. Pull to Refresh
- Used in: Feeds, Lists
- Action: Reloads content from server

#### 3. Swipe Actions
- Used in: Review cards (mobile), Image galleries
- Actions: Like, Share, Delete

#### 4. Tab Navigation
- Used in: Profile pages, Settings
- Pattern: Horizontal tabs with content below

---

### Visual Design Patterns

#### Color Scheme
- **Primary**: Orange (#ff7c0a)
- **Secondary**: Dark Gray (#31343F)
- **Background**: White
- **Text**: Dark Gray (#1F2937)
- **Accent**: Various (for categories, status)

#### Typography
- **Primary Font**: Neusans (custom)
- **Secondary Font**: Inter
- **Headings**: Bold, various sizes
- **Body**: Regular, 16px base

#### Spacing
- **Grid**: 4px base unit
- **Padding**: 16px, 24px, 32px
- **Margins**: 8px, 16px, 24px, 32px

---

## Technical Architecture

### Current Stack (Web)

#### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS + SCSS
- **State Management**: React Context API
- **Data Fetching**: Custom hooks + Fetch API

#### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (via Hasura)
- **GraphQL**: Hasura GraphQL Engine
- **Authentication**: Firebase Auth
- **Storage**: AWS S3
- **Caching**: Redis (Upstash)

#### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Monitoring**: Custom logging

---

### Target Stack (React Native)

#### Core
- **Framework**: React Native (Expo recommended)
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Context + Zustand (optional)

#### UI/UX
- **Component Library**: React Native Paper / NativeBase / Tamagui
- **Icons**: React Native Vector Icons
- **Animations**: React Native Reanimated
- **Images**: Expo Image / React Native Fast Image

#### Backend Integration
- **API Client**: Axios / Fetch
- **GraphQL**: Apollo Client (if needed)
- **Authentication**: Firebase Auth (React Native)
- **Storage**: AWS S3 SDK

#### Native Features
- **Location**: Expo Location
- **Maps**: React Native Maps
- **Camera**: Expo Camera
- **Notifications**: Expo Notifications
- **File System**: Expo File System

---

## API Specifications

### Base URL
```
Production: https://yourdomain.com/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All authenticated endpoints require Firebase ID token in Authorization header:
```
Authorization: Bearer {firebaseIdToken}
```

### Endpoint Categories

#### 1. Authentication
- `POST /api/user/me` - Get current user
- `POST /api/v1/restaurant-users/create-restaurant-user` - Create user
- `PUT /api/v1/restaurant-users/update-restaurant-user` - Update user

#### 2. Restaurants
- `GET /api/v1/restaurants-v2/get-restaurants` - List restaurants
- `GET /api/v1/restaurants-v2/get-restaurant-by-id` - Get restaurant
- `POST /api/v1/restaurants-v2/create-restaurant` - Create restaurant
- `POST /api/v1/restaurants-v2/match-restaurant` - Match restaurant

#### 3. Reviews
- `GET /api/v1/restaurant-reviews/get-all-reviews` - List all reviews
- `GET /api/v1/restaurant-reviews/get-review-by-id` - Get review
- `GET /api/v1/restaurant-reviews/get-reviews-by-restaurant` - Restaurant reviews
- `GET /api/v1/restaurant-reviews/get-user-reviews` - User reviews
- `GET /api/v1/restaurant-reviews/get-following-feed` - Following feed
- `POST /api/v1/restaurant-reviews/create-review` - Create review
- `PUT /api/v1/restaurant-reviews/update-review` - Update review
- `DELETE /api/v1/restaurant-reviews/delete-review` - Delete review
- `POST /api/v1/restaurant-reviews/toggle-like` - Like/unlike
- `POST /api/v1/restaurant-reviews/create-comment` - Add comment
- `GET /api/v1/restaurant-reviews/get-replies` - Get comments

#### 4. Users
- `GET /api/v1/restaurant-users/get-restaurant-user-by-id` - Get user
- `GET /api/v1/restaurant-users/get-restaurant-user-by-username` - Get user by username
- `POST /api/v1/restaurant-users/follow` - Follow user
- `POST /api/v1/restaurant-users/unfollow` - Unfollow user
- `GET /api/v1/restaurant-users/get-followers-list` - Get followers
- `GET /api/v1/restaurant-users/get-following-list` - Get following
- `GET /api/v1/restaurant-users/suggested` - Suggested users

#### 5. Wishlist & Check-ins
- `GET /api/v1/restaurant-users/get-wishlist` - Get wishlist
- `POST /api/v1/restaurant-users/toggle-favorite` - Add/remove wishlist
- `GET /api/v1/restaurant-users/get-checkins` - Get check-ins
- `POST /api/v1/restaurant-users/toggle-checkin` - Add/remove check-in

#### 6. Taxonomy
- `GET /api/v1/categories/get-categories` - List categories
- `GET /api/v1/cuisines/get-cuisines` - List cuisines
- `GET /api/v1/palates/get-palates` - List palates
- `GET /api/v1/price-ranges/get-price-ranges` - List price ranges

#### 7. Upload
- `POST /api/v1/upload/image` - Upload single image
- `POST /api/v1/upload/images` - Upload multiple images

---

## Feature Specifications

### Feature 1: Home Feed

**Purpose**: Display personalized restaurant reviews

**Components**:
- Hero search bar
- Review feed (grid/list)
- Filter options
- Infinite scroll

**Data Requirements**:
- Reviews with restaurant and author data
- Pagination support
- Cache for performance

**User Actions**:
- Scroll through reviews
- Click review to view detail
- Like/comment on reviews
- Search for restaurants
- Filter by palate

---

### Feature 2: Restaurant Discovery

**Purpose**: Help users find restaurants

**Components**:
- Search bar
- Filter sidebar
- Restaurant grid/list
- Map view (optional)

**Data Requirements**:
- Restaurant list with filters
- Location data
- Rating and review counts
- Images

**User Actions**:
- Search by keyword
- Filter by cuisine, price, rating
- Sort by rating, distance, price
- View restaurant detail
- Add to wishlist

---

### Feature 3: Review Creation

**Purpose**: Allow users to create and share reviews

**Components**:
- Multi-step form
- Image upload
- Restaurant search/selection
- Content editor
- Preview

**Data Requirements**:
- Restaurant data
- Image upload capability
- Draft saving
- Validation rules

**User Actions**:
- Select restaurant
- Upload images
- Write content
- Set rating
- Add hashtags
- Save draft or publish

---

### Feature 4: Social Feed

**Purpose**: Show reviews from followed users

**Components**:
- Review feed
- User suggestions
- Empty state with CTA

**Data Requirements**:
- Reviews from followed users
- User suggestions
- Follow relationships

**User Actions**:
- View following feed
- Follow suggested users
- Engage with reviews
- Navigate to user profiles

---

### Feature 5: User Profile

**Purpose**: Display user information and activity

**Components**:
- Profile header
- Tabs (Reviews, Wishlist, Check-ins, Listings)
- Statistics
- Follow buttons

**Data Requirements**:
- User data
- Reviews, wishlist, check-ins
- Follower/following counts
- Statistics

**User Actions**:
- View profile
- Switch tabs
- Edit profile (own profile)
- Follow/unfollow
- View followers/following

---

## Migration Considerations

### Platform Differences

#### 1. Navigation
- **Web**: Next.js routing, browser history
- **Mobile**: React Navigation, stack/tab navigation
- **Consideration**: Implement navigation structure early

#### 2. Images
- **Web**: Next.js Image optimization
- **Mobile**: Native image components, caching
- **Consideration**: Use optimized image loading

#### 3. Forms
- **Web**: HTML forms, browser validation
- **Mobile**: Native input components, custom validation
- **Consideration**: Build reusable form components

#### 4. Modals
- **Web**: Overlay modals, portal rendering
- **Mobile**: Native modals, bottom sheets
- **Consideration**: Use platform-appropriate modals

#### 5. Location
- **Web**: Browser geolocation API
- **Mobile**: Native location services
- **Consideration**: Handle permissions properly

---

### Performance Considerations

1. **Image Optimization**:
   - Use optimized image formats
   - Implement lazy loading
   - Cache images locally

2. **API Calls**:
   - Implement request deduplication
   - Use caching strategies
   - Optimize payload sizes

3. **State Management**:
   - Minimize re-renders
   - Use memoization
   - Implement proper loading states

---

### User Experience Adaptations

1. **Touch Interactions**:
   - Larger touch targets (min 44x44px)
   - Swipe gestures
   - Pull to refresh

2. **Offline Support**:
   - Cache critical data
   - Queue actions for sync
   - Show offline indicators

3. **Notifications**:
   - Push notifications for engagement
   - In-app notifications
   - Badge counts

---

## Conclusion

This document provides a comprehensive baseline for migrating TastyPlates to React Native. The product is a social restaurant discovery platform with rich review features, social networking, and personalized recommendations.

**Key Takeaways**:
- **Core Value**: Palate-based restaurant discovery with social reviews
- **Main Features**: Restaurant discovery, reviews, social feed, profiles, wishlist/check-ins
- **User Flows**: Onboarding, discovery, review creation, social engagement
- **Technical**: REST API with Hasura GraphQL backend, Firebase auth, AWS S3 storage

**Next Steps**:
1. Review and validate this specification
2. Create detailed screen mockups
3. Plan technical architecture
4. Begin implementation with core features
5. Iterate based on user feedback

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team
