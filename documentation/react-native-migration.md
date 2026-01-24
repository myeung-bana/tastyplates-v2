# React Native Migration Plan - TastyPlates

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack Analysis](#tech-stack-analysis)
3. [API Documentation](#api-documentation)
4. [Key Product Functions](#key-product-functions)
5. [Sitemap and Structure](#sitemap-and-structure)
6. [Migration Strategy](#migration-strategy)
7. [React Native Implementation Guide](#react-native-implementation-guide)
8. [Component Mapping](#component-mapping)
9. [State Management](#state-management)
10. [Navigation Structure](#navigation-structure)
11. [Authentication Migration](#authentication-migration)
12. [Data Layer Migration](#data-layer-migration)
13. [UI/UX Adaptations](#uiux-adaptations)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Considerations](#deployment-considerations)

---

## Executive Summary

This document provides a comprehensive migration plan for converting the TastyPlates Next.js web application to React Native. TastyPlates is a restaurant discovery and review platform that allows users to discover restaurants, write reviews, follow other users, and manage wishlists and check-ins.

### Key Application Features
- Restaurant discovery with advanced filtering
- User reviews and ratings system
- Social features (follow, like, comment)
- Wishlist and check-in functionality
- User profiles and onboarding
- Restaurant listing creation (TastyStudio)
- Multi-language support
- Location-based search

### Migration Scope
- **Frontend**: Next.js → React Native (Expo/React Native CLI)
- **Backend**: Keep existing API endpoints (Next.js API routes remain)
- **Database**: No changes (Hasura GraphQL + PostgreSQL)
- **Authentication**: Firebase Auth (compatible with React Native)
- **Storage**: AWS S3 (compatible)

---

## Tech Stack Analysis

### Current Web Stack

#### Frontend Framework
- **Next.js 16.0.7** (App Router)
- **React 19.2.0**
- **TypeScript 5.x**
- **Tailwind CSS 3.4.1**
- **SCSS/SASS**

#### UI Libraries
- **@heroui/react** (UI components)
- **@radix-ui/react** (Headless UI primitives)
- **framer-motion** (Animations)
- **react-hot-toast** (Notifications)
- **lucide-react** (Icons)
- **react-icons** (Additional icons)

#### State Management
- **React Context API** (LocationContext, LanguageContext, UploadContext, FollowContext)
- **Custom Hooks** (useFirebaseSession, useUserData, etc.)

#### Backend & Database
- **Hasura GraphQL** (Database layer)
- **PostgreSQL** (Database)
- **Next.js API Routes** (REST API endpoints)
- **Redis/Upstash** (Caching & Rate Limiting)

#### Authentication
- **Firebase Authentication** (Email/Password + Google OAuth)
- **Firebase Admin SDK** (Server-side verification)

#### Storage & Media
- **AWS S3** (Image storage)
- **Next.js Image Optimization**

#### Additional Services
- **Google Maps API** (@react-google-maps/api)
- **Apollo Client** (GraphQL client - partially used)
- **date-fns** (Date utilities)
- **marked** (Markdown parsing)

### React Native Target Stack

#### Core Framework
- **React Native 0.74+** or **Expo SDK 51+**
- **TypeScript 5.x**
- **React Navigation 6.x** (Navigation)

#### UI Libraries
- **React Native Paper** or **NativeBase** or **Tamagui** (UI component library)
- **react-native-reanimated** (Animations - replaces framer-motion)
- **react-native-toast-message** or **react-native-flash-message** (Notifications)
- **react-native-vector-icons** or **@expo/vector-icons** (Icons)
- **react-native-svg** (SVG support)

#### State Management
- **React Context API** (Keep existing contexts)
- **Zustand** or **Redux Toolkit** (Optional - for complex state)
- **React Query / TanStack Query** (Server state management)

#### Backend Integration
- **Keep existing Next.js API routes** (No changes needed)
- **Axios** or **Fetch API** (HTTP client)
- **@apollo/client** (GraphQL client - if needed)

#### Authentication
- **@react-native-firebase/auth** or **expo-firebase** (Firebase Auth)
- **@react-native-google-signin/google-signin** (Google OAuth)

#### Storage & Media
- **AWS S3 SDK** (react-native-aws3 or aws-amplify)
- **expo-image** or **react-native-fast-image** (Image optimization)
- **expo-file-system** (File handling)

#### Location & Maps
- **react-native-maps** (Maps - replaces Google Maps web)
- **expo-location** (Location services)
- **@react-native-community/geolocation** (Alternative)

#### Additional Libraries
- **date-fns** (Keep - compatible)
- **react-native-markdown-display** (Markdown rendering)
- **@react-native-async-storage/async-storage** (Local storage)
- **react-native-gesture-handler** (Gesture handling)

---

## API Documentation

### Base URL Structure

All API endpoints follow the pattern:
```
/api/v1/{resource}/{action}
```

**Production Base URL**: `https://yourdomain.com/api/v1`
**Development Base URL**: `http://localhost:3000/api/v1`

### Authentication

Most endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${firebaseIdToken}`,
  'Content-Type': 'application/json'
}
```

### API Endpoints

#### 1. Restaurant Endpoints

##### Get All Restaurants
```
GET /api/v1/restaurants-v2/get-restaurants
```

**Query Parameters:**
- `limit` (number, 1-1000, default: 100)
- `offset` (number, default: 0)
- `status` (string: 'publish', 'draft', 'private', default: 'publish')
- `search` (string: searches title, slug, listing_street)
- `cuisine_ids` (string: comma-separated IDs, e.g., "1,2,3")
- `palate_ids` (string: comma-separated IDs)
- `category_ids` (string: comma-separated IDs)
- `price_range_id` (number)
- `min_rating` (number: 0-5)
- `max_rating` (number: 0-5)
- `latitude` (number)
- `longitude` (number)
- `radius_km` (number: requires latitude and longitude)
- `is_main_location` (boolean: 'true' or 'false')
- `order_by` (string: 'rating', 'price', 'created_at', 'updated_at', 'distance')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "uuid-string",
      "title": "Restaurant Name",
      "slug": "restaurant-name",
      "description": "Description",
      "featured_image_url": "https://...",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "listing_street": "Address",
      "average_rating": 4.5,
      "price_range_id": 2,
      "cuisines": [{"id": 1, "name": "Italian"}],
      "palates": [{"id": 1, "name": "Spicy"}],
      "categories": [{"id": 1, "name": "Fine Dining"}],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "fetchedAt": "2024-01-01T00:00:00Z"
  }
}
```

##### Get Restaurant by ID
```
GET /api/v1/restaurants-v2/get-restaurant-by-id?id={id}
```

**Query Parameters:**
- `id` (number, required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "uuid-string",
    "title": "Restaurant Name",
    // ... full restaurant object
  }
}
```

##### Create Restaurant
```
POST /api/v1/restaurants-v2/create-restaurant
```

**Request Body:**
```json
{
  "title": "Restaurant Name",
  "description": "Description",
  "latitude": 35.6762,
  "longitude": 139.6503,
  "listing_street": "Address",
  "cuisine_ids": [1, 2],
  "palate_ids": [1],
  "category_ids": [1],
  "price_range_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "uuid-string",
    // ... created restaurant object
  }
}
```

##### Match Restaurant
```
POST /api/v1/restaurants-v2/match-restaurant
```

Matches a restaurant by name and location to avoid duplicates.

#### 2. Review Endpoints

##### Get All Reviews
```
GET /api/v1/restaurant-reviews/get-all-reviews
```

**Query Parameters:**
- `limit` (number, default: 16)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uuid": "uuid-string",
      "restaurant_uuid": "restaurant-uuid",
      "author_id": 1,
      "content": "Review content",
      "rating": 4.5,
      "images": [
        {
          "url": "https://...",
          "alt_text": "Image description"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "likes_count": 10,
      "comments_count": 5,
      "author": {
        "id": 1,
        "username": "user123",
        "display_name": "User Name",
        "profile_image": {...}
      },
      "restaurant": {
        "uuid": "restaurant-uuid",
        "title": "Restaurant Name",
        "slug": "restaurant-name"
      }
    }
  ],
  "meta": {
    "total": 100,
    "limit": 16,
    "offset": 0,
    "hasMore": true
  }
}
```

##### Get Review by ID
```
GET /api/v1/restaurant-reviews/get-review-by-id?id={id}
```

##### Get Reviews by Restaurant
```
GET /api/v1/restaurant-reviews/get-reviews-by-restaurant?restaurant_uuid={uuid}&limit={limit}&offset={offset}
```

##### Get User Reviews
```
GET /api/v1/restaurant-reviews/get-user-reviews?user_id={id}&limit={limit}&offset={offset}
```

##### Create Review
```
POST /api/v1/restaurant-reviews/create-review
```

**Request Body:**
```json
{
  "restaurant_uuid": "restaurant-uuid",
  "content": "Review content",
  "rating": 4.5,
  "images": [
    {
      "url": "https://...",
      "alt_text": "Image description"
    }
  ],
  "draft": false
}
```

**Headers:**
- `Authorization: Bearer {firebaseIdToken}` (required)

##### Update Review
```
PUT /api/v1/restaurant-reviews/update-review
```

**Request Body:**
```json
{
  "id": 1,
  "content": "Updated content",
  "rating": 5.0,
  "images": [...]
}
```

##### Delete Review
```
DELETE /api/v1/restaurant-reviews/delete-review?id={id}
```

##### Toggle Like
```
POST /api/v1/restaurant-reviews/toggle-like
```

**Request Body:**
```json
{
  "review_id": 1
}
```

##### Get Replies
```
GET /api/v1/restaurant-reviews/get-replies?review_id={id}&limit={limit}&offset={offset}
```

##### Create Comment
```
POST /api/v1/restaurant-reviews/create-comment
```

**Request Body:**
```json
{
  "review_id": 1,
  "content": "Comment content",
  "parent_id": null
}
```

##### Get Following Feed
```
GET /api/v1/restaurant-reviews/get-following-feed?limit={limit}&offset={offset}
```

Returns reviews from users the current user follows.

##### Get Draft Reviews
```
GET /api/v1/restaurant-reviews/get-draft-reviews?limit={limit}&offset={offset}
```

#### 3. User Endpoints

##### Get Current User
```
GET /api/user/me
```

**Headers:**
- `Authorization: Bearer {firebaseIdToken}` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "display_name": "User Name",
    "email": "user@example.com",
    "profile_image": {...},
    "bio": "User bio",
    "palates": [...],
    "onboarding_complete": true
  }
}
```

##### Get Restaurant User by ID
```
GET /api/v1/restaurant-users/get-restaurant-user-by-id?id={id}
```

##### Get Restaurant User by Username
```
GET /api/v1/restaurant-users/get-restaurant-user-by-username?username={username}
```

##### Get Restaurant User by Firebase UUID
```
GET /api/v1/restaurant-users/get-restaurant-user-by-firebase-uuid?firebase_uuid={uuid}
```

##### Create Restaurant User
```
POST /api/v1/restaurant-users/create-restaurant-user
```

**Request Body:**
```json
{
  "firebase_uuid": "firebase-uuid",
  "email": "user@example.com",
  "username": "user123",
  "display_name": "User Name",
  "profile_image": {...},
  "auth_method": "email",
  "onboarding_complete": false
}
```

##### Update Restaurant User
```
PUT /api/v1/restaurant-users/update-restaurant-user
```

**Request Body:**
```json
{
  "id": 1,
  "display_name": "Updated Name",
  "bio": "Updated bio",
  "profile_image": {...}
}
```

##### Delete Restaurant User
```
DELETE /api/v1/restaurant-users/delete-restaurant-user?id={id}
```

##### Check Username Availability
```
GET /api/v1/restaurant-users/check-username?username={username}
```

**Response:**
```json
{
  "success": true,
  "available": true
}
```

#### 4. Social Features

##### Follow User
```
POST /api/v1/restaurant-users/follow
```

**Request Body:**
```json
{
  "user_id": 2
}
```

##### Unfollow User
```
POST /api/v1/restaurant-users/unfollow
```

**Request Body:**
```json
{
  "user_id": 2
}
```

##### Check Follow Status
```
GET /api/v1/restaurant-users/check-follow-status?user_id={id}
```

**Response:**
```json
{
  "success": true,
  "is_following": true
}
```

##### Get Followers List
```
GET /api/v1/restaurant-users/get-followers-list?user_id={id}&limit={limit}&offset={offset}
```

##### Get Following List
```
GET /api/v1/restaurant-users/get-following-list?user_id={id}&limit={limit}&offset={offset}
```

##### Get Followers Count
```
GET /api/v1/restaurant-users/get-followers-count?user_id={id}
```

##### Get Following Count
```
GET /api/v1/restaurant-users/get-following-count?user_id={id}
```

##### Get Suggested Users
```
GET /api/v1/restaurant-users/suggested?limit={limit}
```

#### 5. Wishlist & Check-ins

##### Get Wishlist
```
GET /api/v1/restaurant-users/get-wishlist?user_id={id}&limit={limit}&offset={offset}
```

##### Toggle Favorite
```
POST /api/v1/restaurant-users/toggle-favorite
```

**Request Body:**
```json
{
  "restaurant_uuid": "restaurant-uuid"
}
```

##### Get Check-ins
```
GET /api/v1/restaurant-users/get-checkins?user_id={id}&limit={limit}&offset={offset}
```

##### Toggle Check-in
```
POST /api/v1/restaurant-users/toggle-checkin
```

**Request Body:**
```json
{
  "restaurant_uuid": "restaurant-uuid"
}
```

#### 6. Taxonomy Endpoints

##### Get Categories
```
GET /api/v1/categories/get-categories?limit={limit}&offset={offset}&search={search}
```

##### Get Category by ID
```
GET /api/v1/categories/get-category-by-id?id={id}
```

##### Get Cuisines
```
GET /api/v1/cuisines/get-cuisines?limit={limit}&offset={offset}&search={search}
```

##### Get Cuisine by ID
```
GET /api/v1/cuisines/get-cuisine-by-id?id={id}
```

##### Get Palates
```
GET /api/v1/palates/get-palates?limit={limit}&offset={offset}&search={search}
```

##### Get Palate by ID
```
GET /api/v1/palates/get-palate-by-id?id={id}
```

##### Get Price Ranges
```
GET /api/v1/price-ranges/get-price-ranges
```

##### Get Price Range by ID
```
GET /api/v1/price-ranges/get-price-range-by-id?id={id}
```

#### 7. Upload Endpoints

##### Upload Image
```
POST /api/v1/upload/image
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (image file)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/...",
    "key": "s3-key",
    "alt_text": "Image description"
  }
}
```

##### Upload Multiple Images
```
POST /api/v1/upload/images
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: `files[]` (array of image files)

#### 8. Content Endpoints

##### Get Content by Type
```
GET /api/v1/content/{type}
```

**Types:**
- `privacy-policy`
- `terms-of-service`
- `content-guidelines`
- `cookie-policy`

### Error Response Format

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "field_name",
      "message": "Field-specific error"
    }
  ]
}
```

### Rate Limiting

API endpoints use Redis/Upstash for rate limiting. Check response headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

### Caching

Many endpoints use Redis caching. Check response headers:
- `X-Cache`: `HIT` or `MISS`
- `Cache-Control`: HTTP cache directives

---

## Key Product Functions

### 1. Restaurant Discovery

#### Features
- **Search**: Full-text search across restaurant names, addresses, and slugs
- **Filtering**: By cuisine, palate, category, price range, rating, location
- **Location-based**: Radius search with distance calculation
- **Sorting**: By rating, price, distance, date
- **Pagination**: Limit/offset based pagination

#### Implementation Notes
- Uses Haversine formula for distance calculation
- Client-side filtering for distance-based sorting
- Redis caching for performance (10-minute TTL)
- Supports both main locations and branches

### 2. Review System

#### Features
- **Create Reviews**: Text, rating (0-5), multiple images
- **Edit Reviews**: Update content, rating, images
- **Delete Reviews**: Soft delete with confirmation
- **Draft Reviews**: Save reviews as drafts
- **Like Reviews**: Toggle like/unlike
- **Comment System**: Nested comments/replies
- **Review Feed**: All reviews, user reviews, restaurant reviews, following feed

#### Implementation Notes
- Images stored in AWS S3
- Batch fetching of restaurants and authors to avoid N+1 queries
- Real-time like count updates
- Markdown support for review content

### 3. User Profiles

#### Features
- **Profile View**: Display name, bio, profile image, stats
- **User Stats**: Reviews count, followers, following, check-ins
- **Tabs**: Reviews, Wishlist, Check-ins, Listings
- **Follow/Unfollow**: Social connections
- **Edit Profile**: Update display name, bio, profile image

#### Implementation Notes
- Profile images from Firebase or custom upload
- Username uniqueness validation
- Onboarding flow for new users

### 4. Social Features

#### Features
- **Follow System**: Follow/unfollow users
- **Following Feed**: Reviews from followed users
- **Suggested Users**: Algorithm-based user suggestions
- **Followers/Following Lists**: Paginated lists with search

#### Implementation Notes
- Bidirectional follow relationships
- Real-time follower count updates
- Context-based state management (FollowContext)

### 5. Wishlist & Check-ins

#### Features
- **Wishlist**: Save restaurants to wishlist
- **Check-ins**: Mark restaurants as visited
- **Lists View**: Display wishlist and check-ins in profile

#### Implementation Notes
- Toggle-based (add/remove) functionality
- Linked to restaurant UUIDs
- User-specific data

### 6. Restaurant Listing (TastyStudio)

#### Features
- **Create Restaurant**: Multi-step form
- **Edit Restaurant**: Update details
- **Draft Listings**: Save incomplete listings
- **Restaurant Matching**: Prevent duplicates by name/location

#### Implementation Notes
- Step-by-step onboarding flow
- Image upload during creation
- Validation for required fields
- Branch relationship support

### 7. Onboarding

#### Features
- **Step 1**: Palate preferences selection
- **Step 2**: Location preferences
- **Completion**: Mark onboarding as complete

#### Implementation Notes
- Multi-step form with progress indicator
- Saves preferences to user profile
- Redirects to home after completion

### 8. Authentication

#### Features
- **Email/Password**: Traditional sign-up/sign-in
- **Google OAuth**: One-click authentication
- **Session Management**: Firebase session cookies
- **Auto User Creation**: Creates Hasura user after Firebase auth

#### Implementation Notes
- Firebase as primary auth system
- Automatic account linking by email
- Session persistence across app restarts
- Protected route handling

### 9. Location Services

#### Features
- **Geolocation**: Get user's current location
- **Location Selection**: Manual location input
- **Location Context**: Global location state
- **Location-based Search**: Filter restaurants by location

#### Implementation Notes
- Browser geolocation API (web)
- React Native location services (mobile)
- Location context for global state
- Distance calculations for restaurant search

### 10. Image Management

#### Features
- **Image Upload**: Single and multiple uploads
- **Image Cropping**: Client-side image cropping
- **S3 Storage**: AWS S3 for image storage
- **Image Optimization**: Next.js Image (web) / expo-image (mobile)

#### Implementation Notes
- Multipart form data uploads
- Image compression before upload
- Alt text support for accessibility
- URL generation for S3 images

### 11. Search & Filtering

#### Features
- **Restaurant Search**: Full-text search
- **Advanced Filters**: Multiple filter combinations
- **Filter Persistence**: Save filter preferences
- **Filter Sidebar**: Mobile-friendly filter UI

#### Implementation Notes
- Debounced search input
- URL query parameter persistence
- Filter state management
- Reset filters functionality

### 12. Content Management

#### Features
- **Legal Pages**: Privacy policy, terms of service, content guidelines
- **Markdown Support**: Rendered markdown content
- **Dynamic Content**: Content from API or static files

#### Implementation Notes
- Static markdown files in `/content/legal/`
- Markdown rendering with `marked` library
- SEO-friendly static pages

---

## Sitemap and Structure

### Web Application Routes

#### Public Routes
```
/                           # Homepage - Restaurant feed
/restaurants                # Restaurant listing page
/restaurants/[slug]         # Restaurant detail page
/restaurants/cuisines       # Cuisine listing
/reviews                    # All reviews feed
/review-listing             # Review listing page
/hashtag/[hashtag]          # Hashtag page
/following                  # Following feed
/profile                    # Current user profile
/profile/[username]         # User profile page
/profile/edit               # Edit profile
/content-guidelines         # Content guidelines
/privacy-policy             # Privacy policy
/terms-of-service           # Terms of service
/cookie-policy              # Cookie policy
/reset-password             # Password reset
```

#### Authenticated Routes
```
/onboarding                 # User onboarding
/settings                   # Settings dashboard
/settings/general           # General settings
/settings/edit              # Edit settings
/settings/account-security  # Account security
/settings/content-preferences # Content preferences
/settings/support           # Support
/tastystudio                # TastyStudio dashboard
/tastystudio/dashboard      # Studio dashboard
/tastystudio/add-review     # Add review
/tastystudio/edit-review    # Edit review
/tastystudio/review-listing # Review listing
/listing                    # Restaurant listing creation
/listing/step-1             # Listing step 1
/listing/step-2             # Listing step 2
/listing/draft              # Draft listings
/listing/explanation        # Listing explanation
/edit-review                # Edit review page
/reviews/viewer             # Review viewer
```

### Component Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── restaurants/       # Restaurant pages
│   ├── profile/           # Profile pages
│   ├── settings/          # Settings pages
│   ├── tastystudio/       # TastyStudio pages
│   └── ...
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── common/            # Common components
│   ├── layout/            # Layout components
│   ├── Restaurant/        # Restaurant components
│   ├── review/            # Review components
│   ├── Profile/           # Profile components
│   ├── Settings/          # Settings components
│   └── ui/                # UI primitives
├── services/              # Service layer
│   ├── auth/              # Auth services
│   ├── restaurant/        # Restaurant services
│   ├── Reviews/           # Review services
│   └── user/              # User services
├── repositories/          # Data access layer
│   └── http/              # HTTP repositories
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── utils/                 # Utility functions
├── constants/             # Constants
├── types/                 # TypeScript types
└── styles/                # SCSS styles
```

### React Native Screen Structure

```
screens/
├── Auth/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── ResetPasswordScreen.tsx
├── Home/
│   ├── HomeScreen.tsx
│   └── RestaurantFeedScreen.tsx
├── Restaurants/
│   ├── RestaurantListScreen.tsx
│   ├── RestaurantDetailScreen.tsx
│   └── RestaurantSearchScreen.tsx
├── Reviews/
│   ├── ReviewFeedScreen.tsx
│   ├── ReviewDetailScreen.tsx
│   ├── CreateReviewScreen.tsx
│   └── EditReviewScreen.tsx
├── Profile/
│   ├── ProfileScreen.tsx
│   ├── EditProfileScreen.tsx
│   ├── UserProfileScreen.tsx
│   └── ProfileTabs/
│       ├── ReviewsTab.tsx
│       ├── WishlistTab.tsx
│       ├── CheckinsTab.tsx
│       └── ListingsTab.tsx
├── Social/
│   ├── FollowingFeedScreen.tsx
│   ├── FollowersListScreen.tsx
│   ├── FollowingListScreen.tsx
│   └── SuggestedUsersScreen.tsx
├── TastyStudio/
│   ├── StudioDashboardScreen.tsx
│   ├── CreateRestaurantScreen.tsx
│   └── DraftListingsScreen.tsx
├── Settings/
│   ├── SettingsScreen.tsx
│   ├── GeneralSettingsScreen.tsx
│   ├── AccountSecurityScreen.tsx
│   └── ContentPreferencesScreen.tsx
├── Onboarding/
│   ├── OnboardingScreen.tsx
│   └── OnboardingSteps/
│       ├── Step1Screen.tsx
│       └── Step2Screen.tsx
└── Legal/
    ├── PrivacyPolicyScreen.tsx
    ├── TermsOfServiceScreen.tsx
    └── ContentGuidelinesScreen.tsx
```

---

## Migration Strategy

### Phase 1: Foundation Setup (Week 1-2)

1. **Initialize React Native Project**
   - Choose Expo or React Native CLI
   - Set up TypeScript
   - Configure project structure
   - Set up development environment

2. **Core Infrastructure**
   - Set up navigation (React Navigation)
   - Configure state management
   - Set up API client (Axios/Fetch)
   - Configure environment variables

3. **Authentication Setup**
   - Integrate Firebase Auth
   - Set up Google OAuth
   - Create auth context/hooks
   - Implement protected routes

### Phase 2: Core Features (Week 3-6)

1. **Authentication Flow**
   - Login/Register screens
   - Session management
   - Protected route handling
   - Onboarding flow

2. **Restaurant Discovery**
   - Restaurant list screen
   - Restaurant detail screen
   - Search functionality
   - Filter implementation
   - Location services

3. **Review System**
   - Review feed screen
   - Review detail screen
   - Create/edit review screens
   - Image upload
   - Like/comment functionality

### Phase 3: Social Features (Week 7-8)

1. **User Profiles**
   - Profile screens
   - Edit profile
   - Profile tabs (Reviews, Wishlist, Check-ins)

2. **Social Interactions**
   - Follow/unfollow
   - Following feed
   - Followers/following lists
   - Suggested users

### Phase 4: Advanced Features (Week 9-10)

1. **TastyStudio**
   - Dashboard
   - Create restaurant
   - Draft management

2. **Settings**
   - Settings screens
   - Account management
   - Preferences

3. **Additional Features**
   - Wishlist/Check-ins
   - Legal pages
   - Notifications

### Phase 5: Polish & Testing (Week 11-12)

1. **UI/UX Refinement**
   - Animations
   - Loading states
   - Error handling
   - Accessibility

2. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance testing

3. **Optimization**
   - Image optimization
   - Caching strategies
   - Performance optimization
   - Bundle size optimization

---

## React Native Implementation Guide

### Project Setup

#### Option 1: Expo (Recommended for faster development)

```bash
npx create-expo-app TastyPlatesMobile --template
cd TastyPlatesMobile
npm install
```

#### Option 2: React Native CLI

```bash
npx react-native init TastyPlatesMobile --template react-native-template-typescript
cd TastyPlatesMobile
npm install
```

### Required Dependencies

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/drawer": "^6.6.6",
    "react-native-screens": "^3.27.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.1",
    "@react-native-firebase/app": "^19.0.1",
    "@react-native-firebase/auth": "^19.0.1",
    "@react-native-google-signin/google-signin": "^10.1.0",
    "axios": "^1.6.2",
    "@tanstack/react-query": "^5.17.9",
    "zustand": "^4.4.7",
    "react-native-maps": "^1.10.0",
    "expo-location": "~16.5.5",
    "expo-image": "~1.10.5",
    "expo-file-system": "~16.0.6",
    "react-native-toast-message": "^2.1.7",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "date-fns": "^4.1.0",
    "react-native-markdown-display": "^7.0.0-alpha.2"
  }
}
```

### API Client Setup

```typescript
// src/services/api/client.ts
import axios from 'axios';
import auth from '@react-native-firebase/auth';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://yourdomain.com/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase token to requests
apiClient.interceptors.request.use(async (config) => {
  const user = auth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Navigation Setup

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Restaurants" component={RestaurantStack} />
        <Stack.Screen name="Reviews" component={ReviewStack} />
        <Stack.Screen name="Profile" component={ProfileStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### State Management with React Query

```typescript
// src/hooks/useRestaurants.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';

export function useRestaurants(params: RestaurantSearchParams) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: async () => {
      const response = await apiClient.get('/restaurants-v2/get-restaurants', {
        params,
      });
      return response.data;
    },
  });
}
```

---

## Component Mapping

### Web → React Native Component Mapping

| Web Component | React Native Equivalent | Notes |
|--------------|------------------------|-------|
| `next/link` | `@react-navigation/native` | Use navigation.navigate() |
| `next/image` | `expo-image` or `react-native-fast-image` | Image optimization |
| `framer-motion` | `react-native-reanimated` | Animations |
| `react-hot-toast` | `react-native-toast-message` | Notifications |
| `lucide-react` | `@expo/vector-icons` | Icons |
| Tailwind CSS | StyleSheet or styled-components | Styling |
| `@heroui/react` | React Native Paper / NativeBase | UI components |
| `react-slick` | `react-native-snap-carousel` | Carousels |
| `@react-google-maps/api` | `react-native-maps` | Maps |

### Key Component Migrations

#### 1. Image Component

**Web:**
```tsx
import Image from 'next/image';
<Image src={url} alt={alt} width={200} height={200} />
```

**React Native:**
```tsx
import { Image } from 'expo-image';
<Image source={{ uri: url }} style={{ width: 200, height: 200 }} />
```

#### 2. Navigation

**Web:**
```tsx
import Link from 'next/link';
<Link href="/restaurants/[slug]" as={`/restaurants/${slug}`}>
  Restaurant
</Link>
```

**React Native:**
```tsx
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
<TouchableOpacity onPress={() => navigation.navigate('RestaurantDetail', { slug })}>
  <Text>Restaurant</Text>
</TouchableOpacity>
```

#### 3. Forms

**Web:**
```tsx
<form onSubmit={handleSubmit}>
  <input type="text" value={value} onChange={onChange} />
</form>
```

**React Native:**
```tsx
<View>
  <TextInput value={value} onChangeText={onChange} />
</View>
```

#### 4. Modals

**Web:**
```tsx
import { Modal } from '@heroui/modal';
<Modal isOpen={isOpen} onClose={onClose}>Content</Modal>
```

**React Native:**
```tsx
import { Modal } from 'react-native';
<Modal visible={isOpen} onRequestClose={onClose}>
  <View>Content</View>
</Modal>
```

---

## State Management

### Current Web State Management

The web app uses:
- **React Context API** for global state (Location, Language, Upload, Follow)
- **Custom Hooks** for data fetching and state
- **Component State** for local UI state

### React Native State Management Strategy

#### Option 1: Keep Context API (Recommended for Start)

```typescript
// src/contexts/LocationContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface LocationContextType {
  location: Location | null;
  setLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  
  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}
```

#### Option 2: Add Zustand for Complex State

```typescript
// src/stores/authStore.ts
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

#### Option 3: React Query for Server State

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Navigation Structure

### React Native Navigation Hierarchy

```
AppNavigator (Stack)
├── AuthStack (Stack)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ResetPasswordScreen
├── MainTabs (Bottom Tabs)
│   ├── HomeTab
│   │   └── HomeStack
│   │       ├── HomeScreen
│   │       ├── RestaurantDetailScreen
│   │       └── ReviewDetailScreen
│   ├── DiscoverTab
│   │   └── DiscoverStack
│   │       ├── RestaurantListScreen
│   │       ├── RestaurantDetailScreen
│   │       └── SearchScreen
│   ├── FollowingTab
│   │   └── FollowingStack
│   │       ├── FollowingFeedScreen
│   │       └── ReviewDetailScreen
│   └── ProfileTab
│       └── ProfileStack
│           ├── ProfileScreen
│           ├── EditProfileScreen
│           ├── SettingsScreen
│           └── UserProfileScreen
└── Modals (Stack)
    ├── CreateReviewModal
    ├── CreateRestaurantModal
    └── ImagePickerModal
```

### Navigation Implementation

```typescript
// src/navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  RestaurantDetail: { slug: string };
  ReviewDetail: { id: number };
  Profile: { username?: string };
  // ... more routes
};

// src/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      {/* ... more screens */}
    </Stack.Navigator>
  );
}
```

---

## Authentication Migration

### Firebase Auth Setup

```typescript
// src/services/auth/firebaseAuthService.ts
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
});

export class FirebaseAuthService {
  // Email/Password Sign In
  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      // Fetch/create user in Hasura
      await this.syncUserToHasura(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      await this.syncUserToHasura(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sync user to Hasura
  private async syncUserToHasura(firebaseUser: any) {
    // Call API to create/update user in Hasura
    const response = await apiClient.post('/restaurant-users/get-restaurant-user-by-firebase-uuid', {
      firebase_uuid: firebaseUser.uid,
    });
    // Handle response
  }
}
```

### Auth Context

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user from Hasura
        const hasuraUser = await fetchUserFromHasura(firebaseUser.uid);
        setUser(hasuraUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Data Layer Migration

### Repository Pattern

Keep the repository pattern from the web app:

```typescript
// src/repositories/http/restaurant/restaurantRepository.ts
import apiClient from '@/services/api/client';

export class RestaurantRepository {
  async getRestaurants(params: RestaurantSearchParams) {
    const response = await apiClient.get('/restaurants-v2/get-restaurants', {
      params,
    });
    return response.data;
  }

  async getRestaurantById(id: number) {
    const response = await apiClient.get('/restaurants-v2/get-restaurant-by-id', {
      params: { id },
    });
    return response.data;
  }
}

export const restaurantRepository = new RestaurantRepository();
```

### Service Layer

```typescript
// src/services/restaurant/restaurantService.ts
import { restaurantRepository } from '@/repositories/http/restaurant/restaurantRepository';

export class RestaurantService {
  async getRestaurants(params: RestaurantSearchParams) {
    const result = await restaurantRepository.getRestaurants(params);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  }
}

export const restaurantService = new RestaurantService();
```

### React Query Hooks

```typescript
// src/hooks/useRestaurants.ts
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant/restaurantService';

export function useRestaurants(params: RestaurantSearchParams) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: () => restaurantService.getRestaurants(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## UI/UX Adaptations

### Design System

#### Colors
- Use the same color palette from Tailwind config
- Create a theme file for React Native

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#FF6B35',
  secondary: '#004E89',
  background: '#FFFFFF',
  foreground: '#1F2937',
  // ... more colors
};
```

#### Typography
- Map web fonts to React Native fonts
- Use `expo-font` for custom fonts

```typescript
// src/theme/typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  body: { fontSize: 16, fontWeight: 'normal' },
  // ... more styles
};
```

#### Spacing
- Use consistent spacing scale
- Create spacing utility

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Component Library

Choose a React Native UI library:

1. **React Native Paper** (Material Design)
2. **NativeBase** (Customizable)
3. **Tamagui** (Performance-focused)
4. **Custom Components** (Full control)

### Responsive Design

- Use `Dimensions` API for screen sizes
- Use `useSafeAreaInsets` for safe areas
- Create responsive utilities

```typescript
// src/utils/responsive.ts
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isTablet = width >= 768;
export const isSmallDevice = width < 375;

export function scale(size: number) {
  return (width / 375) * size;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/services/restaurantService.test.ts
import { restaurantService } from '@/services/restaurant/restaurantService';

describe('RestaurantService', () => {
  it('should fetch restaurants', async () => {
    const restaurants = await restaurantService.getRestaurants({ limit: 10 });
    expect(restaurants).toBeDefined();
    expect(Array.isArray(restaurants)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// __tests__/screens/RestaurantListScreen.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { RestaurantListScreen } from '@/screens/Restaurants/RestaurantListScreen';

describe('RestaurantListScreen', () => {
  it('should render restaurant list', async () => {
    const { getByText } = render(<RestaurantListScreen />);
    await waitFor(() => {
      expect(getByText('Restaurant Name')).toBeDefined();
    });
  });
});
```

### E2E Tests

Use Detox or Maestro for E2E testing:

```typescript
// e2e/restaurantFlow.e2e.ts
describe('Restaurant Flow', () => {
  it('should navigate to restaurant detail', async () => {
    await element(by.id('restaurant-item')).tap();
    await expect(element(by.id('restaurant-detail'))).toBeVisible();
  });
});
```

---

## Deployment Considerations

### Build Configuration

#### iOS
- Configure Xcode project
- Set up App Store Connect
- Configure certificates and provisioning profiles
- Set up CI/CD pipeline

#### Android
- Configure Gradle build
- Set up Google Play Console
- Configure signing keys
- Set up CI/CD pipeline

### Environment Variables

```typescript
// src/config/env.ts
export const config = {
  apiUrl: __DEV__ 
    ? 'http://localhost:3000/api/v1'
    : 'https://yourdomain.com/api/v1',
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    // ... more config
  },
};
```

### Performance Optimization

1. **Image Optimization**
   - Use `expo-image` for optimized images
   - Implement lazy loading
   - Use image caching

2. **Bundle Size**
   - Use code splitting
   - Remove unused dependencies
   - Optimize images and assets

3. **Caching**
   - Implement API response caching
   - Use React Query cache
   - Cache images locally

4. **Network Optimization**
   - Implement request deduplication
   - Use pagination efficiently
   - Implement offline support

### Monitoring & Analytics

- **Firebase Analytics**: User behavior tracking
- **Crashlytics**: Error tracking
- **Performance Monitoring**: App performance metrics
- **Custom Analytics**: Business metrics

---

## Additional Resources

### Documentation References
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query](https://tanstack.com/query/latest)
- [Firebase React Native](https://rnfirebase.io/)

### Migration Checklist

- [ ] Project setup and configuration
- [ ] Authentication implementation
- [ ] Navigation structure
- [ ] API client setup
- [ ] Core screens (Home, Restaurants, Reviews)
- [ ] User profiles
- [ ] Social features
- [ ] TastyStudio features
- [ ] Settings
- [ ] Image upload and management
- [ ] Location services
- [ ] Testing
- [ ] Performance optimization
- [ ] App store submission

---

## Conclusion

This migration plan provides a comprehensive guide for converting the TastyPlates web application to React Native. The key considerations are:

1. **Keep the existing API**: No backend changes needed
2. **Maintain architecture patterns**: Repository, service, and hook patterns
3. **Adapt UI components**: Map web components to React Native equivalents
4. **Handle platform differences**: Navigation, images, forms, etc.
5. **Optimize for mobile**: Performance, offline support, native features

The migration should be done incrementally, starting with core features and gradually adding advanced functionality. Regular testing and user feedback will ensure a successful migration.
