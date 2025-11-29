# Restaurant API Guide

This guide provides comprehensive documentation for client-facing applications to fetch restaurant data and details from the public API endpoints. It covers all available endpoints, data models, query parameters, response formats, and best practices for integration.

## Table of Contents

1. [Overview](#overview)
2. [Base URL and Authentication](#base-url-and-authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Field Descriptions](#field-descriptions)
6. [Query Parameters](#query-parameters)
7. [Response Formats](#response-formats)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)
10. [Best Practices](#best-practices)
11. [Rate Limiting](#rate-limiting)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Restaurant API provides access to restaurant listings, details, and related information. All endpoints are RESTful and return JSON responses. The API supports:

- **Fetching multiple restaurants** with pagination, filtering, and search
- **Fetching individual restaurants** by ID or UUID
- **Filtering by status** (published, draft, etc.)
- **Search functionality** across restaurant titles, slugs, and addresses
- **Comprehensive restaurant data** including location, hours, images, cuisines, and palates

### Key Features

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Responses**: All responses are in JSON format
- **Pagination Support**: Efficient data retrieval with limit/offset
- **Search Capabilities**: Full-text search across multiple fields
- **Rich Data Models**: Complete restaurant information including taxonomies
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
      ]
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
    "cuisines": [ /* ... */ ],
    "palates": [ /* ... */ ]
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
  price?: number;                // Average price (DECIMAL(10,2))
  
  // Ratings
  average_rating?: number;      // Average rating (DECIMAL(3,2), range: 0-5)
  ratings_count?: number;        // Number of ratings (INTEGER)
  
  // Location
  listing_street?: string;       // Street address
  longitude?: number;            // Longitude coordinate (DECIMAL(10,7), range: -180 to 180)
  latitude?: number;             // Latitude coordinate (DECIMAL(10,7), range: -90 to 90)
  google_zoom?: number;          // Google Maps zoom level (INTEGER, range: 0-21)
  address?: GoogleAddress;       // Detailed address object (JSONB)
  
  // Contact Information
  phone?: string;                // Phone number
  menu_url?: string;             // URL to menu
  
  // Hours
  opening_hours?: OpeningHours;  // Opening hours object (JSONB)
  
  // Media
  featured_image_url?: string;    // Primary featured image URL
  uploaded_images?: string[];    // Array of image URLs (JSONB)
  
  // Taxonomies
  cuisines?: Cuisine[];          // Array of cuisine objects (JSONB)
  palates?: Palate[];           // Array of palate objects (JSONB)
  
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
- **`price`** (number, optional): Average price per person. Stored as DECIMAL(10,2), maximum value: 99,999,999.99.

### Rating Fields

- **`average_rating`** (number, optional): Average customer rating. Range: 0-5, stored as DECIMAL(3,2).
- **`ratings_count`** (number, optional): Total number of ratings/reviews.

### Location Fields

- **`listing_street`** (string, optional): Simple street address string.
- **`longitude`** (number, optional): Longitude coordinate. Range: -180 to 180, stored as DECIMAL(10,7) with max 3 digits before decimal, 7 after.
- **`latitude`** (number, optional): Latitude coordinate. Range: -90 to 90, stored as DECIMAL(10,7) with max 3 digits before decimal, 7 after.
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
import { useState, useEffect } from 'react';

interface UseRestaurantsParams {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}

function useRestaurants(params?: UseRestaurantsParams) {
  const [restaurants, setRestaurants] = useState([]);
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

  return { restaurants, loading, error, meta };
}

// Usage in component
function RestaurantList() {
  const { restaurants, loading, error, meta } = useRestaurants({
    limit: 20,
    status: 'publish'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Restaurants ({meta?.total})</h1>
      {restaurants.map(restaurant => (
        <div key={restaurant.id}>
          <h2>{restaurant.title}</h2>
          <p>{restaurant.content}</p>
        </div>
      ))}
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
if (restaurant.featured_image_url) {
  // Use image
}

if (restaurant.cuisines && restaurant.cuisines.length > 0) {
  // Display cuisines
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

---

## Additional Resources

- **API Base URL**: `/api/v1/restaurants-v2`
- **Response Format**: JSON
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (e.g., `2024-01-20T12:00:00.000Z`)

---

## Version History

- **v1.0** (2024): Initial public API documentation
  - GET all restaurants endpoint
  - GET restaurant by UUID endpoint
  - Comprehensive field documentation
  - Code examples in multiple languages

---

## Support

For API support, issues, or feature requests, please contact the development team or refer to the main API documentation.

---

**Last Updated**: January 2024

