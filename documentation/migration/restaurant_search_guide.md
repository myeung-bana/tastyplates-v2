# Restaurant Review Location Tagging Guide

This guide provides comprehensive documentation for implementing restaurant location tagging functionality in client-side restaurant review creation. This feature allows users to search for restaurants using Google Places API (similar to Instagram location search) and either select an existing restaurant from the database or create a new restaurant listing.

## Table of Contents

1. [Overview](#overview)
2. [Current Implementation (Admin-Side)](#current-implementation-admin-side)
3. [Requirements](#requirements)
4. [Architecture Overview](#architecture-overview)
5. [Implementation Steps](#implementation-steps)
6. [API Endpoints](#api-endpoints)
7. [Component Structure](#component-structure)
8. [User Flow](#user-flow)
9. [Matching Logic](#matching-logic)
10. [Code Examples](#code-examples)
11. [Testing Considerations](#testing-considerations)
12. [Future Enhancements](#future-enhancements)

---

## Overview

### Feature Description

When users create restaurant reviews on the client-side application, they should be able to:

1. **Search for restaurants** using Google Places API (similar to Instagram's location search)
2. **Tag a location** to their review
3. **Select existing restaurants** from the database if a match is found
4. **Create new restaurant listings** if the restaurant doesn't exist in the system

### Key Benefits

- **Improved User Experience**: Users can easily find and tag restaurants without manual entry
- **Data Consistency**: Reduces duplicate restaurant entries by matching against existing database
- **Rich Location Data**: Leverages Google Places API for accurate location information
- **Seamless Integration**: Similar UX to popular social media platforms (Instagram, Facebook)

---

## Current Implementation (Admin-Side)

### Existing Components

The admin-side implementation (`/restaurants-listing-v2/create`) includes:

1. **`RestaurantSearchModal`** (`src/components/ui/restaurant-search-modal.tsx`)
   - Modal dialog for searching restaurants
   - Supports search by name or address
   - Uses Google Places Autocomplete
   - Fetches full place details using `place_id`

2. **`GooglePlacesAutocomplete`** (`src/components/ui/google-places-autocomplete.tsx`)
   - Reusable autocomplete component
   - Supports `restaurant` and `address` search types
   - Handles Google Maps API integration
   - Provides place selection callbacks

3. **`fetchPlaceDetails`** (`src/lib/google-places-utils.ts`)
   - Utility function to fetch detailed place information
   - Returns structured `RestaurantPlaceData` object
   - Includes name, phone, website, hours, address, coordinates

### Current Flow (Admin-Side)

```
User clicks "Search Restaurant" button
  ↓
RestaurantSearchModal opens
  ↓
User searches by name or address
  ↓
Google Places Autocomplete shows suggestions
  ↓
User selects a place
  ↓
fetchPlaceDetails() called with place_id
  ↓
Restaurant data auto-fills form fields
  ↓
User confirms and creates restaurant listing
```

---

## Requirements

### Functional Requirements

1. **Location Search**
   - Users can search for restaurants using Google Places API
   - Search should work by restaurant name or address
   - Results should display in a user-friendly format (similar to Instagram)
   - Should show restaurant name, address, and optionally an image

2. **Existing Restaurant Matching**
   - When a user selects a location, check if restaurant exists in database
   - Matching should be done by:
     - Google Place ID (primary)
     - Restaurant name + address (fallback)
     - Coordinates proximity (optional)
   - If match found, show existing restaurant and allow selection
   - Display restaurant details (name, address, rating, image if available)

3. **New Restaurant Creation**
   - If no match found, allow user to create new restaurant listing
   - Auto-fill form with Google Places data
   - Create restaurant with status `draft` or `pending` (for admin review)
   - Link review to newly created restaurant

4. **Review Association**
   - Associate review with selected/created restaurant via `restaurant_uuid`
   - Ensure restaurant UUID is available for review creation API

### Technical Requirements

1. **API Endpoints Needed**
   - Search existing restaurants by place_id
   - Search existing restaurants by name/address
   - Create new restaurant from Google Places data
   - Create review with restaurant association

2. **Components Needed**
   - Location search component (client-side)
   - Restaurant selection/matching UI
   - New restaurant creation flow (optional, can be automatic)

3. **Data Flow**
   - Google Places API → Match against database → Select existing or create new → Associate with review

---

## Architecture Overview

### System Flow

```
┌─────────────────┐
│  User Creates   │
│  Review         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Location Search │
│  (Google Places) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Database  │
│  for Match       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Match  │ │ No Match     │
│ Found  │ │ Found        │
└───┬────┘ └──────┬───────┘
    │             │
    ▼             ▼
┌────────┐ ┌──────────────┐
│ Select │ │ Create New   │
│ Existing│ │ Restaurant   │
│ Restaurant│ │ (Auto-fill)  │
└───┬────┘ └──────┬───────┘
    │             │
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │ Associate   │
    │ Review with │
    │ Restaurant  │
    └─────────────┘
```

### Data Models

#### Restaurant (from database)
```typescript
interface Restaurant {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  listing_street: string;
  address: {
    place_id?: string;
    street_address?: string;
    city?: string;
    state?: string;
    // ... other address fields
  };
  latitude?: number;
  longitude?: number;
  featured_image_url?: string;
  average_rating?: number;
  // ... other fields
}
```

#### Google Places Data
```typescript
interface RestaurantPlaceData {
  name: string;
  phone: string;
  website: string;
  businessHours: BusinessHoursEntry[];
  description: string;
  address: {
    formatted_address?: string;
    place_id?: string;
    geometry?: {
      location?: {
        lat: () => number;
        lng: () => number;
      };
    };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  };
}
```

---

## Implementation Steps

### Step 1: Create API Endpoint for Restaurant Matching

**File**: `src/app/api/v1/restaurants-v2/match-restaurant/route.ts`

This endpoint will:
- Accept Google Place ID or restaurant name/address
- Search database for matching restaurant
- Return existing restaurant if found, or null if not found

```typescript
// Pseudo-code structure
export async function POST(request: NextRequest) {
  const { place_id, name, address, latitude, longitude } = await request.json();
  
  // 1. Try to match by place_id (most reliable)
  if (place_id) {
    const restaurant = await findRestaurantByPlaceId(place_id);
    if (restaurant) return { match: true, restaurant };
  }
  
  // 2. Try to match by name + address
  if (name && address) {
    const restaurant = await findRestaurantByNameAndAddress(name, address);
    if (restaurant) return { match: true, restaurant };
  }
  
  // 3. Try to match by coordinates (proximity)
  if (latitude && longitude) {
    const restaurant = await findRestaurantByCoordinates(latitude, longitude);
    if (restaurant) return { match: true, restaurant };
  }
  
  return { match: false, restaurant: null };
}
```

### Step 2: Create Client-Side Location Search Component

**File**: `src/components/reviews/location-search.tsx`

This component will:
- Use Google Places Autocomplete
- Display search results in Instagram-like format
- Handle restaurant selection
- Trigger matching API call

### Step 3: Create Restaurant Selection/Matching UI

**File**: `src/components/reviews/restaurant-match-dialog.tsx`

This component will:
- Show existing restaurant if match found
- Allow user to confirm selection
- Show option to create new if no match
- Display restaurant preview (name, address, image, rating)

### Step 4: Integrate with Review Creation Form

**File**: `src/app/(client)/reviews/create/page.tsx` (or wherever review form exists)

Integration points:
- Add location search button/field
- Handle restaurant selection
- Pass `restaurant_uuid` to review creation API
- Handle new restaurant creation if needed

### Step 5: Update Review Creation API (if needed)

**File**: `src/app/api/v1/reviews-v2/create-review/route.ts`

Ensure it:
- Accepts `restaurant_uuid` (already does)
- Optionally handles restaurant creation before review creation
- Validates restaurant exists

---

## API Endpoints

### 1. Match Restaurant

**Endpoint**: `POST /api/v1/restaurants-v2/match-restaurant`

**Purpose**: Check if a restaurant exists in the database based on Google Places data.

**Request Body**:
```json
{
  "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Pizza Palace",
  "address": "123 Main Street, Toronto, ON",
  "latitude": 43.6532,
  "longitude": -79.3832
}
```

**Response (Match Found)**:
```json
{
  "match": true,
  "restaurant": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pizza Palace",
    "slug": "pizza-palace",
    "listing_street": "123 Main Street",
    "address": {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "city": "Toronto",
      "state": "Ontario"
    },
    "featured_image_url": "https://...",
    "average_rating": 4.5
  }
}
```

**Response (No Match)**:
```json
{
  "match": false,
  "restaurant": null
}
```

### 2. Create Restaurant from Google Places

**Endpoint**: `POST /api/v1/restaurants-v2/create-restaurant` (existing, may need enhancement)

**Purpose**: Create a new restaurant listing from Google Places data.

**Request Body**: (Same as existing create-restaurant endpoint)
```json
{
  "title": "Pizza Palace",
  "status": "draft",
  "listing_street": "123 Main Street",
  "address": {
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "street_address": "123 Main Street",
    "city": "Toronto",
    "state": "Ontario",
    "state_short": "ON",
    "country": "Canada",
    "country_short": "CA",
    "post_code": "M5H 2N2"
  },
  "latitude": 43.6532,
  "longitude": -79.3832,
  "phone": "+1 (555) 123-4567",
  "menu_url": "https://example.com/menu"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pizza Palace",
    // ... other fields
  }
}
```

### 3. Create Review

**Endpoint**: `POST /api/v1/reviews-v2/create-review` (existing)

**Purpose**: Create a review associated with a restaurant.

**Request Body**:
```json
{
  "author_id": 1,
  "restaurant_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Great pizza!",
  "title": "Amazing Experience",
  "rating": 5,
  "images": ["https://..."],
  "hashtags": ["pizza", "italian"]
}
```

---

## Component Structure

### LocationSearch Component

```typescript
interface LocationSearchProps {
  onLocationSelect: (location: {
    place_id: string;
    name: string;
    address: string;
    restaurant?: Restaurant | null;
  }) => void;
  value?: string;
}

export function LocationSearch({ onLocationSelect, value }: LocationSearchProps) {
  // 1. Google Places Autocomplete
  // 2. Display results in Instagram-like format
  // 3. Handle selection
  // 4. Call matching API
  // 5. Show match dialog or create new
}
```

### RestaurantMatchDialog Component

```typescript
interface RestaurantMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googlePlaceData: RestaurantPlaceData;
  existingRestaurant: Restaurant | null;
  onSelectExisting: (restaurant: Restaurant) => void;
  onCreateNew: (placeData: RestaurantPlaceData) => void;
}

export function RestaurantMatchDialog({
  open,
  onOpenChange,
  googlePlaceData,
  existingRestaurant,
  onSelectExisting,
  onCreateNew
}: RestaurantMatchDialogProps) {
  // Show existing restaurant if match found
  // Show option to create new
  // Handle user selection
}
```

---

## User Flow

### Flow 1: Existing Restaurant Found

```
1. User starts creating review
2. User clicks "Add Location" or "Tag Location"
3. Location search modal opens
4. User types restaurant name/address
5. Google Places suggestions appear
6. User selects a restaurant
7. System checks database for match
8. Match found → Show existing restaurant preview
9. User confirms selection
10. Restaurant UUID associated with review
11. User continues with review creation
```

### Flow 2: New Restaurant Creation

```
1. User starts creating review
2. User clicks "Add Location"
3. Location search modal opens
4. User types restaurant name/address
5. Google Places suggestions appear
6. User selects a restaurant
7. System checks database for match
8. No match found → Show "Create New Restaurant" option
9. User confirms creation
10. System creates restaurant (status: draft/pending)
11. Restaurant UUID returned
12. Restaurant UUID associated with review
13. User continues with review creation
```

### Flow 3: Manual Entry (Fallback)

```
1. User starts creating review
2. User clicks "Add Location"
3. Location search modal opens
4. User cannot find restaurant in Google Places
5. User can skip location tagging (optional)
6. Review created without location (if allowed)
```

---

## Matching Logic

### Priority Order

1. **Primary Match: Google Place ID**
   ```sql
   SELECT * FROM restaurants 
   WHERE address->>'place_id' = $1
   ```
   - Most reliable match
   - Exact match on Google's unique identifier

2. **Secondary Match: Name + Address**
   ```sql
   SELECT * FROM restaurants 
   WHERE LOWER(title) = LOWER($1)
   AND LOWER(listing_street) LIKE LOWER($2)
   ```
   - Fuzzy matching on name
   - Address similarity check

3. **Tertiary Match: Coordinate Proximity**
   ```sql
   SELECT *, 
     (6371 * acos(
       cos(radians($1)) * cos(radians(latitude)) *
       cos(radians(longitude) - radians($2)) +
       sin(radians($1)) * sin(radians(latitude))
     )) AS distance
   FROM restaurants
   WHERE latitude IS NOT NULL 
   AND longitude IS NOT NULL
   HAVING distance < 0.1  -- Within 100 meters
   ORDER BY distance
   LIMIT 1
   ```
   - Haversine formula for distance calculation
   - Match if within 100 meters (configurable)

### Matching Thresholds

- **Place ID Match**: 100% confidence (exact match)
- **Name + Address Match**: 
  - Name similarity: > 80% (using Levenshtein or similar)
  - Address similarity: > 70%
- **Coordinate Match**: 
  - Distance: < 100 meters (0.1 km)
  - Name similarity: > 60% (optional additional check)

---

## Code Examples

### Example 1: Location Search Component

```typescript
"use client";

import { useState } from 'react';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { RestaurantMatchDialog } from '@/components/reviews/restaurant-match-dialog';
import { fetchPlaceDetails, RestaurantPlaceData } from '@/lib/google-places-utils';
import { Restaurant } from '@/types/business';

interface LocationSearchProps {
  onRestaurantSelect: (restaurantUuid: string) => void;
}

export function LocationSearch({ onRestaurantSelect }: LocationSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<RestaurantPlaceData | null>(null);
  const [existingRestaurant, setExistingRestaurant] = useState<Restaurant | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

  const handlePlaceSelect = async (place: { place_id?: string }) => {
    if (!place.place_id) return;

    setIsMatching(true);
    try {
      // Fetch full place details
      const placeData = await fetchPlaceDetails(place.place_id);
      if (!placeData) return;

      setSelectedPlace(placeData);

      // Check for existing restaurant
      const matchResponse = await fetch('/api/v1/restaurants-v2/match-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: placeData.address.place_id,
          name: placeData.name,
          address: placeData.address.formatted_address,
          latitude: placeData.address.geometry?.location?.lat(),
          longitude: placeData.address.geometry?.location?.lng()
        })
      });

      const matchData = await matchResponse.json();
      
      if (matchData.match && matchData.restaurant) {
        setExistingRestaurant(matchData.restaurant);
      } else {
        setExistingRestaurant(null);
      }

      setShowMatchDialog(true);
    } catch (error) {
      console.error('Error matching restaurant:', error);
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelectExisting = (restaurant: Restaurant) => {
    onRestaurantSelect(restaurant.uuid);
    setShowMatchDialog(false);
    setSearchValue(restaurant.title);
  };

  const handleCreateNew = async (placeData: RestaurantPlaceData) => {
    try {
      // Create restaurant from Google Places data
      const createResponse = await fetch('/api/v1/restaurants-v2/create-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: placeData.name,
          status: 'draft', // Or 'pending' for admin review
          listing_street: placeData.address.formatted_address || '',
          phone: placeData.phone,
          menu_url: placeData.website,
          address: {
            place_id: placeData.address.place_id,
            street_address: placeData.address.formatted_address,
            // ... format address components
          },
          latitude: placeData.address.geometry?.location?.lat(),
          longitude: placeData.address.geometry?.location?.lng()
        })
      });

      const createData = await createResponse.json();
      
      if (createData.success && createData.data) {
        onRestaurantSelect(createData.data.uuid);
        setShowMatchDialog(false);
        setSearchValue(createData.data.title);
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  return (
    <div>
      <GooglePlacesAutocomplete
        value={searchValue}
        onChange={setSearchValue}
        onPlaceSelect={handlePlaceSelect}
        placeholder="Search for a restaurant..."
        searchType="restaurant"
      />

      {isMatching && <div>Checking for existing restaurant...</div>}

      {selectedPlace && (
        <RestaurantMatchDialog
          open={showMatchDialog}
          onOpenChange={setShowMatchDialog}
          googlePlaceData={selectedPlace}
          existingRestaurant={existingRestaurant}
          onSelectExisting={handleSelectExisting}
          onCreateNew={handleCreateNew}
        />
      )}
    </div>
  );
}
```

### Example 2: Restaurant Match Dialog

```typescript
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RestaurantPlaceData } from '@/lib/google-places-utils';
import { Restaurant } from '@/types/business';

interface RestaurantMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googlePlaceData: RestaurantPlaceData;
  existingRestaurant: Restaurant | null;
  onSelectExisting: (restaurant: Restaurant) => void;
  onCreateNew: (placeData: RestaurantPlaceData) => void;
}

export function RestaurantMatchDialog({
  open,
  onOpenChange,
  googlePlaceData,
  existingRestaurant,
  onSelectExisting,
  onCreateNew
}: RestaurantMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tag Restaurant Location</DialogTitle>
          <DialogDescription>
            {existingRestaurant 
              ? "We found this restaurant in our database"
              : "This restaurant is not in our database yet"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {existingRestaurant ? (
            <>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">{existingRestaurant.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {existingRestaurant.listing_street}
                </p>
                {existingRestaurant.average_rating && (
                  <p className="text-sm">
                    ⭐ {existingRestaurant.average_rating.toFixed(1)}
                  </p>
                )}
              </div>
              <Button 
                onClick={() => onSelectExisting(existingRestaurant)}
                className="w-full"
              >
                Use This Restaurant
              </Button>
              <Button 
                variant="outline"
                onClick={() => onCreateNew(googlePlaceData)}
                className="w-full"
              >
                Create New Listing Instead
              </Button>
            </>
          ) : (
            <>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">{googlePlaceData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {googlePlaceData.address.formatted_address}
                </p>
              </div>
              <Button 
                onClick={() => onCreateNew(googlePlaceData)}
                className="w-full"
              >
                Create New Restaurant Listing
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Example 3: Match Restaurant API Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';

const MATCH_BY_PLACE_ID = `
  query MatchRestaurantByPlaceId($placeId: String!) {
    restaurants(
      where: { address: { _contains: { place_id: $placeId } } }
      limit: 1
    ) {
      id
      uuid
      title
      slug
      listing_street
      address
      latitude
      longitude
      featured_image_url
      average_rating
      ratings_count
    }
  }
`;

const MATCH_BY_NAME_AND_ADDRESS = `
  query MatchRestaurantByNameAndAddress($name: String!, $address: String!) {
    restaurants(
      where: {
        _and: [
          { title: { _ilike: $name } }
          { listing_street: { _ilike: $address } }
        ]
      }
      limit: 5
    ) {
      id
      uuid
      title
      slug
      listing_street
      address
      latitude
      longitude
      featured_image_url
      average_rating
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const { place_id, name, address, latitude, longitude } = await request.json();

    // Priority 1: Match by Place ID
    if (place_id) {
      const result = await hasuraQuery(MATCH_BY_PLACE_ID, {
        placeId: place_id
      });

      if (result.data?.restaurants?.length > 0) {
        return NextResponse.json({
          match: true,
          restaurant: result.data.restaurants[0],
          matchType: 'place_id'
        });
      }
    }

    // Priority 2: Match by Name + Address
    if (name && address) {
      const result = await hasuraQuery(MATCH_BY_NAME_AND_ADDRESS, {
        name: `%${name}%`,
        address: `%${address.split(',')[0]}%` // Use first part of address
      });

      if (result.data?.restaurants?.length > 0) {
        // Additional similarity check
        const bestMatch = result.data.restaurants[0];
        return NextResponse.json({
          match: true,
          restaurant: bestMatch,
          matchType: 'name_address'
        });
      }
    }

    // Priority 3: Match by Coordinates (if provided)
    if (latitude && longitude) {
      // Implement coordinate-based matching using Haversine formula
      // This would require a custom query or stored procedure
      // For now, return no match
    }

    return NextResponse.json({
      match: false,
      restaurant: null
    });

  } catch (error) {
    console.error('Match Restaurant API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

---

## Testing Considerations

### Unit Tests

1. **Matching Logic**
   - Test place_id matching
   - Test name + address matching
   - Test coordinate proximity matching
   - Test edge cases (null values, empty strings)

2. **Component Tests**
   - Test location search component
   - Test match dialog component
   - Test user interactions

### Integration Tests

1. **API Endpoints**
   - Test match restaurant endpoint with various inputs
   - Test restaurant creation from Google Places data
   - Test review creation with restaurant association

2. **User Flows**
   - Test existing restaurant selection flow
   - Test new restaurant creation flow
   - Test error handling (API failures, network issues)

### E2E Tests

1. **Complete Review Creation Flow**
   - User searches for restaurant
   - System finds match
   - User selects existing restaurant
   - Review created successfully

2. **New Restaurant Creation Flow**
   - User searches for restaurant
   - No match found
   - User creates new restaurant
   - Review created with new restaurant

---

## Future Enhancements

### Phase 2 Features

1. **Smart Matching Improvements**
   - Machine learning for better name matching
   - Fuzzy address matching
   - Duplicate detection and merging

2. **User Experience**
   - Recent locations (cache user's recent searches)
   - Favorite locations
   - Location suggestions based on user's location

3. **Admin Features**
   - Bulk restaurant merging
   - Duplicate detection dashboard
   - Manual restaurant linking

4. **Analytics**
   - Track most tagged restaurants
   - Track new restaurant creation rate
   - Monitor matching accuracy

### Technical Improvements

1. **Performance**
   - Cache Google Places API responses
   - Optimize database queries
   - Implement search result pagination

2. **Reliability**
   - Retry logic for API failures
   - Fallback matching strategies
   - Error recovery mechanisms

---

## Summary

This guide provides a comprehensive roadmap for implementing restaurant location tagging in client-side review creation. The implementation leverages existing admin-side components and extends them for client-side use, ensuring consistency across the platform.

### Key Takeaways

1. **Reuse Existing Components**: Leverage `GooglePlacesAutocomplete` and `fetchPlaceDetails` from admin-side
2. **Smart Matching**: Implement multi-tier matching logic (place_id → name+address → coordinates)
3. **User Experience**: Provide clear feedback and options (select existing vs. create new)
4. **Data Quality**: Ensure restaurant data consistency by matching before creating

### Next Steps

1. Create match restaurant API endpoint
2. Build location search component for reviews
3. Create restaurant match dialog component
4. Integrate with review creation form
5. Test and iterate based on user feedback

---

**Last Updated**: January 2024
