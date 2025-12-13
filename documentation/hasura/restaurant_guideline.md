# Restaurant API Guide

This guide provides comprehensive documentation for client-facing applications to fetch restaurant data and details from the public API endpoints. It covers all available endpoints, data models, query parameters, response formats, and best practices for integration.

## Table of Contents

1. [Overview](#overview)
2. [Base URL and Authentication](#base-url-and-authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Branch Relationships](#branch-relationships)
6. [Field Descriptions](#field-descriptions)
7. [Query Parameters](#query-parameters)
8. [Client-Side Filtering](#client-side-filtering)
9. [Response Formats](#response-formats)
10. [Error Handling](#error-handling)
11. [Code Examples](#code-examples)
12. [Advanced Search Patterns](#advanced-search-patterns)
13. [Best Practices](#best-practices)
14. [Rate Limiting](#rate-limiting)
15. [Troubleshooting](#troubleshooting)

---

## Overview

The Restaurant API provides access to restaurant listings, details, and related information. All endpoints are RESTful and return JSON responses. The API supports:

- **Fetching multiple restaurants** with pagination, filtering, and search
- **Fetching individual restaurants** by ID or UUID
- **Filtering by status** (published, draft, etc.)
- **Search functionality** across restaurant titles, slugs, and addresses
- **Comprehensive restaurant data** including location, hours, images, cuisines, palates, and categories
- **Branch relationships** for restaurants with multiple locations
- **Rich taxonomy data** including cuisines, palates, and categories

### Key Features

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Responses**: All responses are in JSON format
- **Pagination Support**: Efficient data retrieval with limit/offset
- **Search Capabilities**: Full-text search across multiple fields
- **Rich Data Models**: Complete restaurant information including taxonomies and branch relationships
- **Client-Side Filtering**: Advanced filtering examples for taxonomy, location, and price range
- **Error Handling**: Comprehensive error responses with details

---

## Base URL and Authentication

### Base URL

All API endpoints are relative to your application's base URL:

```
/api/v1/restaurants-v2
```

**Example:**
- Development: `http://localhost:3000/api/v1/restaurants-v2`
- Production: `https://yourdomain.com/api/v1/restaurants-v2`

### Authentication

Currently, the public restaurant endpoints do not require authentication. However, this may change in future versions. Check the API documentation for the latest authentication requirements.

---

## API Endpoints

### 1. Get All Restaurants

Fetch a list of restaurants with optional filtering, pagination, and search.

**Endpoint:** `GET /api/v1/restaurants-v2/get-restaurants`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|----------|-------------|
| `limit` | number | No | 100 | Maximum number of restaurants to return |
| `offset` | number | No | 0 | Number of restaurants to skip (for pagination) |
| `status` | string | No | - | Filter by status: `publish`, `draft`, `private` |
| `search` | string | No | - | Search term to match against title, slug, or listing_street |

**Example Request:**
```bash
GET /api/v1/restaurants-v2/get-restaurants?limit=20&offset=0&status=publish&search=pizza
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Pizza Palace",
      "slug": "pizza-palace",
      "status": "publish",
      "content": "Authentic Italian pizza in the heart of the city...",
      "price_range": "$$",
      "price": 25.50,
      "average_rating": 4.5,
      "ratings_count": 150,
      "listing_street": "123 Main Street",
      "phone": "+1 (555) 123-4567",
      "opening_hours": {
        "Monday": {
          "open": "11:00 AM",
          "close": "10:00 PM",
          "closed": false
        },
        "Tuesday": {
          "open": "11:00 AM",
          "close": "10:00 PM",
          "closed": false
        },
        "Wednesday": {
          "closed": true
        }
      },
      "menu_url": "https://example.com/menu",
      "longitude": -73.935242,
      "latitude": 40.730610,
      "google_zoom": 15,
      "featured_image_url": "https://s3.amazonaws.com/bucket/featured.jpg",
      "address": {
        "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "street_address": "123 Main Street",
        "street_number": "123",
        "street_name": "Main Street",
        "city": "New York",
        "state": "New York",
        "state_short": "NY",
        "post_code": "10001",
        "country": "United States",
        "country_short": "US"
      },
      "uploaded_images": [
        "https://s3.amazonaws.com/bucket/image1.jpg",
        "https://s3.amazonaws.com/bucket/image2.jpg"
      ],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "published_at": "2024-01-02T08:00:00.000Z",
      "price_range_id": 2,
      "cuisines": [
        {
          "id": 1,
          "name": "Italian",
          "slug": "italian"
        },
        {
          "id": 2,
          "name": "Pizza",
          "slug": "pizza"
        }
      ],
      "palates": [
        {
          "id": 1,
          "name": "Spicy",
          "slug": "spicy"
        }
      ],
      "categories": [
        {
          "id": 1,
          "name": "Fine Dining",
          "slug": "fine-dining"
        }
      ],
      "branches": [],
      "parent_restaurant": null,
      "is_main_location": true,
      "branch_group_id": null
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false,
    "fetchedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

### 2. Get Restaurant by UUID

Fetch a single restaurant by its UUID.

**Endpoint:** `GET /api/v1/restaurants-v2/get-restaurant-by-id`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uuid` | string | Yes | Restaurant UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) |

**Example Request:**
```bash
GET /api/v1/restaurants-v2/get-restaurant-by-id?uuid=550e8400-e29b-41d4-a716-446655440000
```

**Example Response:**
```json
{
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pizza Palace",
    "slug": "pizza-palace",
    "status": "publish",
    "content": "Authentic Italian pizza...",
    "price_range": "$$",
    "price": 25.50,
    "average_rating": 4.5,
    "ratings_count": 150,
    "listing_street": "123 Main Street",
    "phone": "+1 (555) 123-4567",
    "opening_hours": { /* ... */ },
    "menu_url": "https://example.com/menu",
    "longitude": -73.935242,
    "latitude": 40.730610,
    "google_zoom": 15,
    "featured_image_url": "https://s3.amazonaws.com/bucket/featured.jpg",
    "address": { /* ... */ },
    "uploaded_images": [ /* ... */ ],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "published_at": "2024-01-02T08:00:00.000Z",
      "price_range_id": 2,
      "cuisines": [ /* ... */ ],
      "palates": [ /* ... */ ],
      "categories": [ /* ... */ ],
      "branches": [],
      "parent_restaurant": null,
      "is_main_location": true,
      "branch_group_id": null
  },
  "meta": {
    "fetchedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request**: Missing or invalid UUID format
  ```json
  {
    "error": "Restaurant UUID is required"
  }
  ```

- **404 Not Found**: Restaurant not found
  ```json
  {
    "error": "Restaurant not found"
  }
  ```

---

## Data Models

### Restaurant Object

The restaurant object contains comprehensive information about a restaurant listing.

```typescript
interface Restaurant {
  // Identifiers
  id: number;                    // Unique database ID
  uuid: string;                  // Unique UUID identifier
  title: string;                 // Restaurant name
  slug: string;                  // URL-friendly identifier
  
  // Status and Content
  status: string;                 // Publication status: "publish", "draft", "private"
  content?: string;              // Restaurant description/content
  
  // Pricing
  price_range?: string;          // Price range indicator: "$", "$$", "$$$", "$$$$"
  price_range_id?: number;        // Foreign key to price_ranges table
  price?: number;                // Average price (DECIMAL(10,2))
  
  // Ratings
  average_rating?: number;        // Average rating (DECIMAL(3,2), range: 0-5)
  ratings_count?: number;         // Number of ratings (INTEGER)
  
  // Location
  listing_street?: string;       // Street address
  longitude?: number;            // Longitude coordinate (DOUBLE PRECISION, range: -180 to 180)
  latitude?: number;             // Latitude coordinate (DOUBLE PRECISION, range: -90 to 90)
  google_zoom?: number;          // Google Maps zoom level (INTEGER, range: 0-21)
  address?: GoogleAddress;       // Detailed address object (JSONB)
  
  // Contact Information
  phone?: string;                // Phone number
  menu_url?: string;             // URL to menu
  
  // Hours
  opening_hours?: OpeningHours;  // Opening hours object (JSONB)
  
  // Media
  featured_image_url?: string;   // Primary featured image URL
  uploaded_images?: string[];     // Array of image URLs (JSONB)
  
  // Taxonomies
  cuisines?: Cuisine[];          // Array of cuisine objects (JSONB)
  palates?: Palate[];            // Array of palate objects (JSONB)
  categories?: Category[];        // Array of category objects (JSONB)
  
  // Branch Relationships
  branches?: Restaurant[];        // Array of branch restaurants (if this is a parent)
  parent_restaurant?: Restaurant | null; // Parent restaurant (if this is a branch)
  is_main_location?: boolean;     // Whether this is the main location
  branch_group_id?: number;       // Group ID for related branches
  
  // Timestamps
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  published_at?: string;         // ISO 8601 timestamp (nullable)
}

interface GoogleAddress {
  place_id?: string;             // Google Places ID
  street_address?: string;       // Full street address
  street_number?: string;        // Street number
  street_name?: string;           // Street name
  city?: string;                 // City name
  state?: string;                // State name (full)
  state_short?: string;         // State abbreviation (e.g., "NY")
  post_code?: string;            // Postal/ZIP code
  country?: string;              // Country name (full)
  country_short?: string;       // Country code (e.g., "US")
}

interface OpeningHours {
  [day: string]: {
    open?: string;                // Opening time (e.g., "9:00 AM")
    close?: string;               // Closing time (e.g., "10:00 PM")
    closed?: boolean;            // Whether the restaurant is closed on this day
  };
}

interface Cuisine {
  id: number;                    // Cuisine ID
  name: string;                  // Cuisine name
  slug: string;                  // Cuisine slug
}

interface Palate {
  id: number;                    // Palate ID
  name: string;                  // Palate name
  slug: string;                  // Palate slug
}

interface Category {
  id: number;                    // Category ID
  name: string;                  // Category name
  slug: string;                  // Category slug
}
```

### Response Meta Object

All list responses include metadata for pagination and tracking.

```typescript
interface ResponseMeta {
  total: number;                 // Total number of restaurants matching the query
  limit: number;                 // Requested limit
  offset: number;                // Requested offset
  hasMore: boolean;              // Whether more results are available
  fetchedAt: string;             // ISO 8601 timestamp of when data was fetched
}
```

---

## Branch Relationships

Restaurants can have parent-child relationships where a main restaurant location can have multiple branch locations. This allows restaurants with multiple locations to be organized hierarchically.

### Understanding Branches

- **Parent Restaurant**: The main restaurant location that may have multiple branches. When a restaurant has branches, the `branches` array will contain branch restaurant objects.
- **Branch Restaurant**: A location that belongs to a parent restaurant. When a restaurant is a branch, the `parent_restaurant` field will contain the parent restaurant object.
- **Branch Group**: All restaurants (parent + branches) share the same `branch_group_id` to identify them as part of the same group.

### Branch Fields

- **`branches`** (array, optional): Array of branch restaurant objects. Only present if the restaurant has branches. Each branch object contains basic restaurant information (id, title, slug, listing_street, address, featured_image_url).
- **`parent_restaurant`** (object | null, optional): Parent restaurant object. Only present if the restaurant is a branch. Contains basic parent restaurant information.
- **`is_main_location`** (boolean, optional): Indicates whether this is the main location. Useful for filtering to show only main locations or only branches.
- **`branch_group_id`** (number, optional): Numeric ID shared by all restaurants in the same branch group. Can be used to group related restaurants together.

### Example Response with Branches

**Parent Restaurant with Branches:**
```json
{
  "data": {
    "id": 1,
    "title": "Pizza Palace",
    "slug": "pizza-palace",
    "listing_street": "123 Main Street",
    "branches": [
      {
        "id": 2,
        "title": "Pizza Palace - Downtown",
        "slug": "pizza-palace-downtown",
        "listing_street": "456 Main St",
        "address": {
          "city": "New York",
          "state": "NY",
          "street_address": "456 Main St"
        },
        "featured_image_url": "https://s3.amazonaws.com/bucket/downtown.jpg"
      },
      {
        "id": 3,
        "title": "Pizza Palace - Uptown",
        "slug": "pizza-palace-uptown",
        "listing_street": "789 Park Ave",
        "address": {
          "city": "New York",
          "state": "NY",
          "street_address": "789 Park Ave"
        },
        "featured_image_url": "https://s3.amazonaws.com/bucket/uptown.jpg"
      }
    ],
    "parent_restaurant": null,
    "is_main_location": true,
    "branch_group_id": 1
  }
}
```

**Branch Restaurant:**
```json
{
  "data": {
    "id": 2,
    "title": "Pizza Palace - Downtown",
    "slug": "pizza-palace-downtown",
    "listing_street": "456 Main St",
    "branches": [],
    "parent_restaurant": {
      "id": 1,
      "title": "Pizza Palace",
      "slug": "pizza-palace",
      "listing_street": "123 Main Street",
      "address": {
        "city": "New York",
        "state": "NY"
      }
    },
    "is_main_location": false,
    "branch_group_id": 1
  }
}
```

### Handling Branches in Your Application

```typescript
// Check if restaurant has branches
if (restaurant.branches && restaurant.branches.length > 0) {
  console.log(`Restaurant has ${restaurant.branches.length} branches`);
  restaurant.branches.forEach(branch => {
    console.log(`Branch: ${branch.title} at ${branch.listing_street}`);
  });
}

// Check if restaurant is a branch
if (restaurant.parent_restaurant) {
  console.log(`This is a branch of: ${restaurant.parent_restaurant.title}`);
  // Provide link to view all locations
}

// Filter to show only main locations
const mainLocations = restaurants.filter(r => r.is_main_location !== false);

// Group restaurants by branch_group_id
const groupedByBranch = restaurants.reduce((acc, restaurant) => {
  const groupId = restaurant.branch_group_id || restaurant.id;
  if (!acc[groupId]) {
    acc[groupId] = [];
  }
  acc[groupId].push(restaurant);
  return acc;
}, {} as Record<number, Restaurant[]>);
```

---

## Field Descriptions

### Core Fields

- **`id`** (number, required): Unique database identifier for the restaurant. Use this for internal references.
- **`uuid`** (string, required): Unique UUID identifier. Use this for public-facing references and URLs.
- **`title`** (string, required): The restaurant's display name.
- **`slug`** (string, required): URL-friendly version of the title. Used in URLs and for SEO.
- **`status`** (string, required): Publication status. Common values:
  - `"publish"`: Published and publicly visible
  - `"draft"`: Draft, not yet published
  - `"private"`: Private, restricted access

### Content Fields

- **`content`** (string, optional): Full restaurant description or content. May contain HTML or markdown.
- **`price_range`** (string, optional): Price range indicator:
  - `"$"`: Budget-friendly
  - `"$$"`: Moderate pricing
  - `"$$$"`: Expensive
  - `"$$$$"`: Very expensive
- **`price_range_id`** (number, optional): Foreign key to the `price_ranges` table. Use this for programmatic filtering by price range.
- **`price`** (number, optional): Average price per person. Stored as DECIMAL(10,2), maximum value: 99,999,999.99.

### Rating Fields

- **`average_rating`** (number, optional): Average customer rating. Range: 0-5, stored as DECIMAL(3,2).
- **`ratings_count`** (number, optional): Total number of ratings/reviews.

### Location Fields

- **`listing_street`** (string, optional): Simple street address string.
- **`longitude`** (number, optional): Longitude coordinate. Range: -180 to 180, stored as DOUBLE PRECISION.
- **`latitude`** (number, optional): Latitude coordinate. Range: -90 to 90, stored as DOUBLE PRECISION.
- **`google_zoom`** (number, optional): Recommended Google Maps zoom level. Range: 0-21.
- **`address`** (object, optional): Detailed Google Places address object with structured address components.

### Contact Fields

- **`phone`** (string, optional): Restaurant phone number. Format may vary.
- **`menu_url`** (string, optional): URL to the restaurant's menu (external link).

### Hours Fields

- **`opening_hours`** (object, optional): Structured opening hours by day of week. Each day can have:
  - `open`: Opening time (string, e.g., "9:00 AM")
  - `close`: Closing time (string, e.g., "10:00 PM")
  - `closed`: Boolean indicating if restaurant is closed that day

### Media Fields

- **`featured_image_url`** (string, optional): URL to the primary featured image (typically hosted on S3).
- **`uploaded_images`** (array, optional): Array of image URLs for the restaurant gallery.

### Taxonomy Fields

- **`cuisines`** (array, optional): Array of cuisine objects. Each cuisine has:
  - `id`: Cuisine ID
  - `name`: Cuisine name
  - `slug`: Cuisine slug
- **`palates`** (array, optional): Array of palate objects. Each palate has:
  - `id`: Palate ID
  - `name`: Palate name
  - `slug`: Palate slug
- **`categories`** (array, optional): Array of category objects. Each category has:
  - `id`: Category ID
  - `name`: Category name
  - `slug`: Category slug

### Branch Relationship Fields

- **`branches`** (array, optional): Array of branch restaurant objects. Only present if the restaurant has branches. Each branch contains basic information (id, title, slug, listing_street, address, featured_image_url).
- **`parent_restaurant`** (object | null, optional): Parent restaurant object. Only present if the restaurant is a branch. Contains basic parent restaurant information.
- **`is_main_location`** (boolean, optional): Indicates whether this is the main location. `true` for main locations, `false` for branches, `undefined` for standalone restaurants.
- **`branch_group_id`** (number, optional): Numeric ID shared by all restaurants in the same branch group. Used to identify related restaurants.

### Timestamp Fields

- **`created_at`** (string, required): ISO 8601 timestamp when the restaurant was created.
- **`updated_at`** (string, required): ISO 8601 timestamp when the restaurant was last updated.
- **`published_at`** (string, optional): ISO 8601 timestamp when the restaurant was published (null if not published).

---

## Query Parameters

### Get All Restaurants Parameters

#### `limit` (number, optional, default: 100)

Maximum number of restaurants to return per request.

- **Type**: Integer
- **Range**: 1-1000 (recommended: 1-100)
- **Example**: `?limit=20`

**Best Practice**: Use reasonable limits (20-50) to avoid large response payloads and improve performance.

#### `offset` (number, optional, default: 0)

Number of restaurants to skip before returning results. Used for pagination.

- **Type**: Integer
- **Range**: 0 or greater
- **Example**: `?offset=20` (skips first 20 restaurants)

**Pagination Example:**
```javascript
// Page 1: limit=20&offset=0
// Page 2: limit=20&offset=20
// Page 3: limit=20&offset=40
```

#### `status` (string, optional)

Filter restaurants by publication status.

- **Type**: String
- **Values**: `"publish"`, `"draft"`, `"private"`
- **Example**: `?status=publish`

**Note**: For public-facing applications, typically use `status=publish` to show only published restaurants.

#### `search` (string, optional)

Search term to match against restaurant title, slug, or listing_street.

- **Type**: String
- **Case-insensitive**: Yes
- **Partial matching**: Yes (uses `LIKE` with wildcards)
- **Example**: `?search=pizza`

**Search Behavior:**
- Searches in: `title`, `slug`, `listing_street`
- Case-insensitive matching
- Partial word matching (e.g., "piz" matches "Pizza")

---

## Client-Side Filtering

While the API currently supports basic filtering (`status`, `search`), you can implement advanced filtering on the client side using the returned data. This section provides examples for filtering by taxonomy, location, price range, and more.

### Filtering by Taxonomy

#### Filter by Cuisine

```typescript
function filterByCuisine(restaurants: Restaurant[], cuisineSlug: string): Restaurant[] {
  return restaurants.filter(restaurant => 
    restaurant.cuisines?.some(cuisine => cuisine.slug === cuisineSlug)
  );
}

// Usage
const italianRestaurants = filterByCuisine(allRestaurants, 'italian');
```

#### Filter by Palate

```typescript
function filterByPalate(restaurants: Restaurant[], palateSlug: string): Restaurant[] {
  return restaurants.filter(restaurant => 
    restaurant.palates?.some(palate => palate.slug === palateSlug)
  );
}

// Usage
const spicyRestaurants = filterByPalate(allRestaurants, 'spicy');
```

#### Filter by Category

```typescript
function filterByCategory(restaurants: Restaurant[], categorySlug: string): Restaurant[] {
  return restaurants.filter(restaurant => 
    restaurant.categories?.some(category => category.slug === categorySlug)
  );
}

// Usage
const fineDiningRestaurants = filterByCategory(allRestaurants, 'fine-dining');
```

#### Filter by Multiple Taxonomies

```typescript
function filterByTaxonomies(
  restaurants: Restaurant[],
  filters: {
    cuisineSlug?: string;
    palateSlug?: string;
    categorySlug?: string;
  }
): Restaurant[] {
  let filtered = restaurants;

  if (filters.cuisineSlug) {
    filtered = filterByCuisine(filtered, filters.cuisineSlug);
  }

  if (filters.palateSlug) {
    filtered = filterByPalate(filtered, filters.palateSlug);
  }

  if (filters.categorySlug) {
    filtered = filterByCategory(filtered, filters.categorySlug);
  }

  return filtered;
}

// Usage
const results = filterByTaxonomies(allRestaurants, {
  cuisineSlug: 'italian',
  categorySlug: 'fine-dining'
});
```

### Filtering by Price Range

```typescript
function filterByPriceRange(restaurants: Restaurant[], priceRange: string): Restaurant[] {
  return restaurants.filter(restaurant => 
    restaurant.price_range === priceRange
  );
}

// Filter by price range ID
function filterByPriceRangeId(restaurants: Restaurant[], priceRangeId: number): Restaurant[] {
  return restaurants.filter(restaurant => 
    restaurant.price_range_id === priceRangeId
  );
}

// Usage
const budgetRestaurants = filterByPriceRange(allRestaurants, '$');
const moderateRestaurants = filterByPriceRange(allRestaurants, '$$');
```

### Location-Based Filtering

#### Calculate Distance (Haversine Formula)

```typescript
/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

#### Filter by Location

```typescript
function filterByLocation(
  restaurants: Restaurant[], 
  userLat: number, 
  userLon: number, 
  maxDistanceKm: number
): Restaurant[] {
  return restaurants.filter(restaurant => {
    if (!restaurant.latitude || !restaurant.longitude) return false;
    const distance = calculateDistance(
      userLat, userLon,
      restaurant.latitude, restaurant.longitude
    );
    return distance <= maxDistanceKm;
  });
}

// Usage: Find restaurants within 5km
const nearbyRestaurants = filterByLocation(
  allRestaurants, 
  40.7128,  // User latitude
  -74.0060, // User longitude
  5         // 5km radius
);
```

#### Sort by Distance

```typescript
function sortByDistance(
  restaurants: Restaurant[],
  userLat: number,
  userLon: number
): Restaurant[] {
  return restaurants
    .filter(r => r.latitude && r.longitude)
    .map(restaurant => ({
      restaurant,
      distance: calculateDistance(
        userLat, userLon,
        restaurant.latitude!, restaurant.longitude!
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .map(item => item.restaurant);
}

// Usage
const sortedByDistance = sortByDistance(allRestaurants, 40.7128, -74.0060);
```

### Combined Filtering

```typescript
interface RestaurantFilters {
  cuisineSlug?: string;
  palateSlug?: string;
  categorySlug?: string;
  priceRange?: string;
  priceRangeId?: number;
  minRating?: number;
  maxRating?: number;
  userLat?: number;
  userLon?: number;
  maxDistanceKm?: number;
  isMainLocation?: boolean;
}

function applyMultipleFilters(
  restaurants: Restaurant[],
  filters: RestaurantFilters
): Restaurant[] {
  let filtered = restaurants;

  if (filters.cuisineSlug) {
    filtered = filterByCuisine(filtered, filters.cuisineSlug);
  }

  if (filters.palateSlug) {
    filtered = filterByPalate(filtered, filters.palateSlug);
  }

  if (filters.categorySlug) {
    filtered = filterByCategory(filtered, filters.categorySlug);
  }

  if (filters.priceRange) {
    filtered = filterByPriceRange(filtered, filters.priceRange);
  }

  if (filters.priceRangeId) {
    filtered = filterByPriceRangeId(filtered, filters.priceRangeId);
  }

  if (filters.minRating !== undefined) {
    filtered = filtered.filter(r => 
      (r.average_rating || 0) >= filters.minRating!
    );
  }

  if (filters.maxRating !== undefined) {
    filtered = filtered.filter(r => 
      (r.average_rating || 0) <= filters.maxRating!
    );
  }

  if (filters.userLat && filters.userLon && filters.maxDistanceKm) {
    filtered = filterByLocation(
      filtered,
      filters.userLat,
      filters.userLon,
      filters.maxDistanceKm
    );
  }

  if (filters.isMainLocation !== undefined) {
    filtered = filtered.filter(r => 
      filters.isMainLocation ? r.is_main_location !== false : r.is_main_location === false
    );
  }

  return filtered;
}

// Usage
const results = applyMultipleFilters(allRestaurants, {
  cuisineSlug: 'italian',
  priceRange: '$$',
  minRating: 4.0,
  userLat: 40.7128,
  userLon: -74.0060,
  maxDistanceKm: 10,
  isMainLocation: true
});
```

### Future Server-Side Filtering (Recommended API Enhancements)

The following filtering capabilities could be added to the API in future versions for better performance:

- **`cuisine_ids`** (array): Filter by cuisine IDs
- **`palate_ids`** (array): Filter by palate IDs
- **`category_ids`** (array): Filter by category IDs
- **`price_range_id`** (number): Filter by price range ID
- **`min_rating`** (number): Minimum average rating
- **`max_rating`** (number): Maximum average rating
- **`latitude`** (number) + **`longitude`** (number) + **`radius_km`** (number): Location-based filtering
- **`is_main_location`** (boolean): Filter only main locations or branches
- **`order_by`** (string): Sort by field (e.g., "rating", "distance", "price", "created_at")

---

## Response Formats

### Success Response Structure

All successful responses follow this structure:

```json
{
  "data": [ /* array of restaurant objects */ ],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "fetchedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

### Single Restaurant Response

When fetching a single restaurant:

```json
{
  "data": { /* single restaurant object */ },
  "meta": {
    "fetchedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

### Empty Results

When no restaurants match the query:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false,
    "fetchedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

---

## Error Handling

### HTTP Status Codes

The API uses standard HTTP status codes:

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message",
  "details": [ /* optional array of error details */ ]
}
```

### Common Error Scenarios

#### 1. Missing Required Parameter

**Request:**
```bash
GET /api/v1/restaurants-v2/get-restaurant-by-id
```

**Response (400 Bad Request):**
```json
{
  "error": "Restaurant UUID is required"
}
```

#### 2. Invalid UUID Format

**Request:**
```bash
GET /api/v1/restaurants-v2/get-restaurant-by-id?uuid=invalid-uuid
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid UUID format"
}
```

#### 3. Restaurant Not Found

**Request:**
```bash
GET /api/v1/restaurants-v2/get-restaurant-by-id?uuid=00000000-0000-0000-0000-000000000000
```

**Response (404 Not Found):**
```json
{
  "error": "Restaurant not found"
}
```

#### 4. Server Error

**Response (500 Internal Server Error):**
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

### Error Handling Best Practices

1. **Always check response status**: Verify `response.ok` or check status code
2. **Handle errors gracefully**: Display user-friendly error messages
3. **Log errors**: Log error details for debugging (but don't expose sensitive info to users)
4. **Retry logic**: Implement retry logic for transient errors (5xx status codes)

---

## Code Examples

### JavaScript/TypeScript (Fetch API)

#### Fetch All Restaurants

```typescript
async function fetchRestaurants(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);

  const url = `/api/v1/restaurants-v2/get-restaurants?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

// Usage
const result = await fetchRestaurants({
  limit: 20,
  offset: 0,
  status: 'publish',
  search: 'pizza'
});

console.log('Restaurants:', result.data);
console.log('Total:', result.meta.total);
```

#### Fetch Restaurant by UUID

```typescript
async function fetchRestaurantByUuid(uuid: string) {
  const url = `/api/v1/restaurants-v2/get-restaurant-by-id?uuid=${encodeURIComponent(uuid)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Restaurant not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data; // Return just the restaurant object
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    throw error;
  }
}

// Usage
const restaurant = await fetchRestaurantByUuid('550e8400-e29b-41d4-a716-446655440000');
console.log('Restaurant:', restaurant);
```

#### Pagination Example

```typescript
async function fetchRestaurantsPage(page: number, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const result = await fetchRestaurants({
    limit: pageSize,
    offset: offset,
    status: 'publish'
  });
  
  return {
    restaurants: result.data,
    currentPage: page,
    totalPages: Math.ceil(result.meta.total / pageSize),
    hasMore: result.meta.hasMore,
    total: result.meta.total
  };
}

// Usage
const page1 = await fetchRestaurantsPage(1, 20);
console.log(`Page 1: ${page1.restaurants.length} restaurants`);
console.log(`Total pages: ${page1.totalPages}`);
```

### React Hook Example

```typescript
import { useState, useEffect, useMemo } from 'react';

interface UseRestaurantsParams {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}

interface UseRestaurantsFilters {
  cuisineSlug?: string;
  palateSlug?: string;
  categorySlug?: string;
  priceRange?: string;
  priceRangeId?: number;
  minRating?: number;
  userLat?: number;
  userLon?: number;
  maxDistanceKm?: number;
  isMainLocation?: boolean;
}

function useRestaurants(
  params?: UseRestaurantsParams,
  clientFilters?: UseRestaurantsFilters
) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.offset) searchParams.append('offset', params.offset.toString());
        if (params?.status) searchParams.append('status', params.status);
        if (params?.search) searchParams.append('search', params.search);

        const url = `/api/v1/restaurants-v2/get-restaurants?${searchParams.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setRestaurants(data.data);
        setMeta(data.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params?.limit, params?.offset, params?.status, params?.search]);

  // Apply client-side filters
  const filteredRestaurants = useMemo(() => {
    if (!clientFilters) return restaurants;
    return applyMultipleFilters(restaurants, clientFilters);
  }, [restaurants, clientFilters]);

  return { 
    restaurants: filteredRestaurants, 
    loading, 
    error, 
    meta 
  };
}

// Usage in component
function RestaurantList() {
  const { restaurants, loading, error, meta } = useRestaurants(
    { limit: 100, status: 'publish' },
    {
      cuisineSlug: 'italian',
      minRating: 4.0,
      userLat: 40.7128,
      userLon: -74.0060,
      maxDistanceKm: 10
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Restaurants ({restaurants.length})</h1>
      {restaurants.map(restaurant => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}

// Restaurant Card Component Example
interface RestaurantCardProps {
  restaurant: Restaurant;
}

function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <div className="restaurant-card">
      {restaurant.featured_image_url && (
        <img 
          src={restaurant.featured_image_url} 
          alt={restaurant.title}
          loading="lazy"
        />
      )}
      
      <h2>{restaurant.title}</h2>
      
      {restaurant.content && (
        <p>{restaurant.content.substring(0, 150)}...</p>
      )}
      
      {/* Taxonomies */}
      <div className="taxonomies">
        {restaurant.cuisines && restaurant.cuisines.length > 0 && (
          <div className="cuisines">
            {restaurant.cuisines.map(cuisine => (
              <span key={cuisine.id} className="badge">
                {cuisine.name}
              </span>
            ))}
          </div>
        )}
        
        {restaurant.categories && restaurant.categories.length > 0 && (
          <div className="categories">
            {restaurant.categories.map(category => (
              <span key={category.id} className="badge">
                {category.name}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Rating */}
      {restaurant.average_rating && (
        <div className="rating">
          ⭐ {restaurant.average_rating.toFixed(1)} 
          ({restaurant.ratings_count} reviews)
        </div>
      )}
      
      {/* Price Range */}
      {restaurant.price_range && (
        <div className="price-range">{restaurant.price_range}</div>
      )}
      
      {/* Location */}
      {restaurant.address && (
        <div className="location">
          {restaurant.address.city}, {restaurant.address.state_short}
        </div>
      )}
      
      {/* Branches */}
      {restaurant.branches && restaurant.branches.length > 0 && (
        <div className="branches">
          <strong>{restaurant.branches.length} locations</strong>
        </div>
      )}
      
      {/* Parent Restaurant */}
      {restaurant.parent_restaurant && (
        <div className="parent-restaurant">
          Part of: {restaurant.parent_restaurant.title}
        </div>
      )}
    </div>
  );
}
```

### Python Example

```python
import requests
from typing import Optional, Dict, List

BASE_URL = "https://yourdomain.com/api/v1/restaurants-v2"

def fetch_restaurants(
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
) -> Dict:
    """Fetch restaurants with optional filtering."""
    params = {}
    if limit is not None:
        params['limit'] = limit
    if offset is not None:
        params['offset'] = offset
    if status:
        params['status'] = status
    if search:
        params['search'] = search
    
    url = f"{BASE_URL}/get-restaurants"
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def fetch_restaurant_by_uuid(uuid: str) -> Dict:
    """Fetch a single restaurant by UUID."""
    url = f"{BASE_URL}/get-restaurant-by-id"
    params = {'uuid': uuid}
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()['data']

# Usage
restaurants = fetch_restaurants(limit=20, status='publish', search='pizza')
print(f"Found {restaurants['meta']['total']} restaurants")

restaurant = fetch_restaurant_by_uuid('550e8400-e29b-41d4-a716-446655440000')
print(f"Restaurant: {restaurant['title']}")
```

---

## Advanced Search Patterns

### Multi-Filter Search Component

```typescript
import { useState, useMemo } from 'react';

interface SearchFilters {
  query: string;
  cuisineIds: number[];
  categoryIds: number[];
  priceRangeIds: number[];
  minRating: number;
  location?: {
    lat: number;
    lon: number;
    radiusKm: number;
  };
}

function useRestaurantSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    cuisineIds: [],
    categoryIds: [],
    priceRangeIds: [],
    minRating: 0,
  });
  
  const { restaurants, loading, error, meta } = useRestaurants({
    limit: 100,
    status: 'publish',
    search: filters.query || undefined,
  });
  
  const filteredRestaurants = useMemo(() => {
    let result = restaurants;
    
    // Filter by cuisines (using IDs from taxonomy data)
    if (filters.cuisineIds.length > 0) {
      result = result.filter(r =>
        r.cuisines?.some(c => filters.cuisineIds.includes(c.id))
      );
    }
    
    // Filter by categories
    if (filters.categoryIds.length > 0) {
      result = result.filter(r =>
        r.categories?.some(c => filters.categoryIds.includes(c.id))
      );
    }
    
    // Filter by price range
    if (filters.priceRangeIds.length > 0) {
      result = result.filter(r =>
        r.price_range_id && filters.priceRangeIds.includes(r.price_range_id)
      );
    }
    
    // Filter by rating
    if (filters.minRating > 0) {
      result = result.filter(r =>
        (r.average_rating || 0) >= filters.minRating
      );
    }
    
    // Filter by location
    if (filters.location) {
      result = filterByLocation(
        result,
        filters.location.lat,
        filters.location.lon,
        filters.location.radiusKm
      );
    }
    
    return result;
  }, [restaurants, filters]);
  
  return {
    restaurants: filteredRestaurants,
    filters,
    setFilters,
    loading,
    error,
    meta,
  };
}
```

### Debounced Search with Filters

```typescript
import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

function RestaurantSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<string>('');
  const [minRating, setMinRating] = useState(0);
  
  const { restaurants, loading } = useRestaurantSearch();
  
  // Debounce search query
  const debouncedSetSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );
  
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearch(e.target.value);
  }, [debouncedSetSearch]);
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search restaurants..."
        onChange={handleSearchChange}
      />
      
      <CuisineFilter
        selectedIds={selectedCuisines}
        onChange={setSelectedCuisines}
      />
      
      <CategoryFilter
        selectedIds={selectedCategories}
        onChange={setSelectedCategories}
      />
      
      <PriceRangeFilter
        value={priceRange}
        onChange={setPriceRange}
      />
      
      <RatingFilter
        minRating={minRating}
        onChange={setMinRating}
      />
      
      <RestaurantList 
        restaurants={restaurants} 
        loading={loading} 
      />
    </div>
  );
}
```

### Location-Based Search with User Geolocation

```typescript
async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  if (!navigator.geolocation) {
    return null;
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => resolve(null)
    );
  });
}

function useLocationBasedSearch() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  
  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);
  
  const { restaurants, loading } = useRestaurants(
    { limit: 100, status: 'publish' },
    userLocation ? {
      userLat: userLocation.lat,
      userLon: userLocation.lon,
      maxDistanceKm: radiusKm
    } : undefined
  );
  
  return {
    restaurants,
    loading,
    userLocation,
    radiusKm,
    setRadiusKm,
  };
}
```

### Performance Optimization for Large Datasets

```typescript
import { useMemo, useCallback } from 'react';

function useOptimizedRestaurantFilter(restaurants: Restaurant[]) {
  // Memoize filtered results
  const [filters, setFilters] = useState<RestaurantFilters>({});
  
  const filteredRestaurants = useMemo(() => {
    return applyMultipleFilters(restaurants, filters);
  }, [restaurants, filters]);
  
  // Virtual scrolling for large lists
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  const visibleRestaurants = useMemo(() => {
    return filteredRestaurants.slice(visibleRange.start, visibleRange.end);
  }, [filteredRestaurants, visibleRange]);
  
  const loadMore = useCallback(() => {
    setVisibleRange(prev => ({
      start: prev.start,
      end: prev.end + 20
    }));
  }, []);
  
  return {
    restaurants: visibleRestaurants,
    total: filteredRestaurants.length,
    hasMore: visibleRange.end < filteredRestaurants.length,
    loadMore,
    filters,
    setFilters,
  };
}
```

---

## Best Practices

### 1. Pagination

Always implement pagination for list endpoints:

```typescript
// Good: Paginated requests
const pageSize = 20;
for (let page = 0; page < totalPages; page++) {
  const offset = page * pageSize;
  const result = await fetchRestaurants({ limit: pageSize, offset });
  // Process results
}

// Bad: Fetching all at once
const result = await fetchRestaurants({ limit: 10000 }); // Don't do this!
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  const restaurant = await fetchRestaurantByUuid(uuid);
  // Use restaurant data
} catch (error) {
  if (error.message === 'Restaurant not found') {
    // Show "Restaurant not found" message to user
  } else {
    // Show generic error message
    console.error('Unexpected error:', error);
  }
}
```

### 3. Caching

Implement caching to reduce API calls:

```typescript
const cache = new Map();

async function fetchRestaurantCached(uuid: string) {
  if (cache.has(uuid)) {
    return cache.get(uuid);
  }
  
  const restaurant = await fetchRestaurantByUuid(uuid);
  cache.set(uuid, restaurant);
  return restaurant;
}
```

### 4. Request Debouncing

Debounce search requests to avoid excessive API calls:

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (searchTerm: string) => {
  const result = await fetchRestaurants({ search: searchTerm });
  // Update UI
}, 300); // Wait 300ms after user stops typing
```

### 5. Type Safety

Use TypeScript interfaces for type safety:

```typescript
interface Restaurant {
  id: number;
  uuid: string;
  title: string;
  // ... other fields
}

const restaurant: Restaurant = await fetchRestaurantByUuid(uuid);
```

### 6. Filter Published Restaurants

For public-facing applications, always filter by `status=publish`:

```typescript
const restaurants = await fetchRestaurants({
  status: 'publish', // Only show published restaurants
  limit: 20
});
```

### 7. Handle Optional Fields

Always check for optional fields before using them:

```typescript
// Good: Check for image
if (restaurant.featured_image_url) {
  <img src={restaurant.featured_image_url} alt={restaurant.title} />
} else {
  <img src="/placeholder.jpg" alt={restaurant.title} />
}

// Good: Check for taxonomies
const cuisines = restaurant.cuisines || [];
cuisines.forEach(cuisine => {
  // Process cuisine
});

// Good: Check for categories
if (restaurant.categories && restaurant.categories.length > 0) {
  restaurant.categories.map(category => (
    <span key={category.id}>{category.name}</span>
  ));
}
```

### 8. Handling Branch Relationships

```typescript
// Display main location with branches
function RestaurantWithBranches({ restaurant }: { restaurant: Restaurant }) {
  if (restaurant.branches && restaurant.branches.length > 0) {
    return (
      <div>
        <MainLocation restaurant={restaurant} />
        <BranchesList branches={restaurant.branches} />
      </div>
    );
  }
  
  // If it's a branch, show parent link
  if (restaurant.parent_restaurant) {
    return (
      <div>
        <BranchLocation restaurant={restaurant} />
        <Link to={`/restaurants/${restaurant.parent_restaurant.uuid}`}>
          View all locations
        </Link>
      </div>
    );
  }
  
  return <SingleLocation restaurant={restaurant} />;
}

// Filter to show only main locations
const mainLocations = restaurants.filter(r => r.is_main_location !== false);
```

### 9. Efficient Client-Side Filtering

For large datasets, consider:

```typescript
// Fetch all restaurants once, filter client-side
const { restaurants } = useRestaurants({ limit: 1000, status: 'publish' });

// Memoize filtered results
const filtered = useMemo(() => {
  return applyMultipleFilters(restaurants, filters);
}, [restaurants, filters]);

// Use pagination for display
const [page, setPage] = useState(1);
const pageSize = 20;
const paginated = filtered.slice(
  (page - 1) * pageSize,
  page * pageSize
);

// Debounce filter changes
const debouncedFilters = useMemo(
  () => debounce((newFilters) => {
    setFilters(newFilters);
  }, 300),
  []
);
```

### 10. Location-Based Features

```typescript
// Request user location permission
async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  if (!navigator.geolocation) {
    return null;
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => resolve(null)
    );
  });
}

// Use location for filtering
const userLocation = await getUserLocation();
if (userLocation) {
  const nearby = filterByLocation(
    restaurants,
    userLocation.lat,
    userLocation.lon,
    10 // 10km radius
  );
}
```

---

## Rate Limiting

Currently, there are no rate limits enforced on the public restaurant endpoints. However, please implement reasonable request throttling in your application to avoid overwhelming the server.

**Recommended Limits:**
- Maximum 10 requests per second per client
- Implement exponential backoff for retries
- Cache responses when possible

**Future Changes**: Rate limiting may be implemented in future versions. Monitor API responses for rate limit headers.

---

## Troubleshooting

### Common Issues

#### 1. "Restaurant UUID is required" Error

**Problem**: Missing UUID parameter in request.

**Solution**: Ensure you're passing the `uuid` query parameter:
```typescript
// Correct
const url = `/api/v1/restaurants-v2/get-restaurant-by-id?uuid=${uuid}`;

// Incorrect
const url = `/api/v1/restaurants-v2/get-restaurant-by-id`; // Missing UUID
```

#### 2. "Invalid UUID format" Error

**Problem**: UUID format is incorrect.

**Solution**: Ensure UUID follows the format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
```typescript
// Valid UUID
const uuid = '550e8400-e29b-41d4-a716-446655440000';

// Invalid UUIDs
const invalid1 = '550e8400-e29b-41d4-a716'; // Too short
const invalid2 = '550e8400e29b41d4a716446655440000'; // Missing hyphens
```

#### 3. Empty Results

**Problem**: No restaurants returned despite expecting results.

**Solutions**:
- Check if you're filtering by `status=publish` (draft/private restaurants won't appear)
- Verify search terms are spelled correctly
- Check if `offset` is too high (beyond total results)
- Ensure the restaurant exists in the database

#### 4. CORS Errors

**Problem**: Cross-origin request blocked.

**Solution**: Ensure your application is making requests to the same origin, or configure CORS on the server.

#### 5. Large Response Payloads

**Problem**: Slow loading times due to large responses.

**Solutions**:
- Use pagination with smaller `limit` values (20-50)
- Implement lazy loading or infinite scroll
- Cache responses when appropriate
- Only request necessary fields (if field selection is added in future)

#### 6. Image URLs Not Loading

**Problem**: Restaurant images not displaying.

**Solutions**:
- Verify image URLs are valid and accessible
- Check if images are hosted on S3 and accessible publicly
- Handle missing `featured_image_url` gracefully
- Implement fallback images for missing images

#### 7. Branch Relationships Not Displaying

**Problem**: Branch information not showing or incorrect.

**Solutions**:
- Check if `branches` array exists and has length > 0
- Verify `parent_restaurant` is not null if restaurant is a branch
- Ensure you're handling both parent and branch cases
- Check `is_main_location` flag for filtering

```typescript
// Debug branch relationships
console.log('Branches:', restaurant.branches);
console.log('Parent:', restaurant.parent_restaurant);
console.log('Is Main:', restaurant.is_main_location);
console.log('Branch Group ID:', restaurant.branch_group_id);
```

#### 8. Client-Side Filtering Performance Issues

**Problem**: Slow filtering with large datasets.

**Solutions**:
- Use `useMemo` to cache filtered results
- Implement virtual scrolling for large lists
- Debounce filter changes
- Consider fetching smaller datasets and implementing server-side filtering
- Use Web Workers for heavy filtering operations

```typescript
// Optimize with useMemo
const filtered = useMemo(() => {
  return applyMultipleFilters(restaurants, filters);
}, [restaurants, filters]);
```

#### 9. Missing Taxonomy Data

**Problem**: Cuisines, palates, or categories not appearing.

**Solutions**:
- Check if arrays exist: `restaurant.cuisines?.length > 0`
- Verify data structure matches expected format
- Handle empty arrays gracefully
- Check if restaurant has been assigned taxonomies in the database

```typescript
// Safe taxonomy access
const cuisines = restaurant.cuisines || [];
const categories = restaurant.categories || [];
const palates = restaurant.palates || [];
```

---

## Additional Resources

- **API Base URL**: `/api/v1/restaurants-v2`
- **Response Format**: JSON
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (e.g., `2024-01-20T12:00:00.000Z`)

---

## Version History

- **v1.1** (2024): Enhanced documentation
  - Added branch relationships documentation
  - Added categories field to data model
  - Added client-side filtering examples
  - Added advanced search patterns
  - Added location-based filtering examples
  - Updated all code examples with new fields
  - Added troubleshooting for branches and filtering

- **v1.0** (2024): Initial public API documentation
  - GET all restaurants endpoint
  - GET restaurant by UUID endpoint
  - Comprehensive field documentation
  - Code examples in multiple languages

---

## Quick Reference

### New Fields Quick Reference

| Field | Type | Description |
|-------|------|-------------|
| `categories` | `Category[]` | Array of category objects |
| `price_range_id` | `number` | Foreign key to price_ranges table |
| `branches` | `Restaurant[]` | Array of branch restaurants |
| `parent_restaurant` | `Restaurant \| null` | Parent restaurant object |
| `is_main_location` | `boolean` | Whether this is the main location |
| `branch_group_id` | `number` | Group ID for related branches |

### Client-Side Filtering Functions

- `filterByCuisine(restaurants, cuisineSlug)` - Filter by cuisine slug
- `filterByPalate(restaurants, palateSlug)` - Filter by palate slug
- `filterByCategory(restaurants, categorySlug)` - Filter by category slug
- `filterByPriceRange(restaurants, priceRange)` - Filter by price range string
- `filterByPriceRangeId(restaurants, priceRangeId)` - Filter by price range ID
- `filterByLocation(restaurants, lat, lon, radiusKm)` - Filter by location and radius
- `sortByDistance(restaurants, lat, lon)` - Sort restaurants by distance
- `applyMultipleFilters(restaurants, filters)` - Apply multiple filters at once

### Common Filter Patterns

```typescript
// Filter Italian restaurants with 4+ rating within 10km
const results = applyMultipleFilters(restaurants, {
  cuisineSlug: 'italian',
  minRating: 4.0,
  userLat: 40.7128,
  userLon: -74.0060,
  maxDistanceKm: 10
});

// Filter main locations only
const mainLocations = restaurants.filter(r => r.is_main_location !== false);

// Filter by multiple categories
const fineDiningItalian = restaurants.filter(r =>
  r.categories?.some(c => c.slug === 'fine-dining') &&
  r.cuisines?.some(c => c.slug === 'italian')
);
```

---

## Support

For API support, issues, or feature requests, please contact the development team or refer to the main API documentation.

---

**Last Updated**: January 2024

