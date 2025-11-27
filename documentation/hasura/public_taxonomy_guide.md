# Public Taxonomy API Guide

This document provides a comprehensive guide for accessing taxonomy data (Categories, Cuisines, and Palates) from the public-facing API. This guide is designed for client-side applications that need read-only access to taxonomy information.

---

## Table of Contents

1. [Overview](#overview)
2. [API Base Path](#api-base-path)
3. [Data Structure](#data-structure)
4. [API Endpoints](#api-endpoints)
   - [Categories](#categories)
   - [Cuisines](#cuisines)
   - [Palates](#palates)
5. [Service Layer](#service-layer)
6. [Type Definitions](#type-definitions)
7. [Usage Examples](#usage-examples)
8. [Hierarchical Structure](#hierarchical-structure)
9. [Filtering and Search](#filtering-and-search)
10. [Best Practices](#best-practices)
11. [Error Handling](#error-handling)

---

## Overview

### Core Principles

1. **Read-Only Access**: All endpoints are GET requests - no write operations
2. **RESTful Design**: Follows standard REST conventions
3. **Type Safety**: Full TypeScript support with exported interfaces
4. **Hierarchical Data**: Supports parent-child relationships
5. **Search & Filter**: Built-in search and filtering capabilities
6. **Service Layer**: Abstracted service classes for easy integration

### What Are Taxonomies?

Taxonomies are classification systems used to categorize restaurants:

- **Categories**: General restaurant categories (e.g., "Fine Dining", "Casual")
- **Cuisines**: Types of cuisine (e.g., "Italian", "Japanese", "Mexican")
- **Palates**: Taste profiles (e.g., "Spicy", "Sweet", "Savory")

All taxonomies support hierarchical structures with parent-child relationships.

---

## API Base Path

All taxonomy API endpoints are prefixed with `/api/v1/`:

```
/api/v1/{taxonomy-type}/get-{taxonomy-type}s
/api/v1/{taxonomy-type}/get-{taxonomy-type}-by-id
```

Where `{taxonomy-type}` is one of:
- `categories`
- `cuisines`
- `palates`

---

## Data Structure

### Common Fields

All taxonomy types share these common fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique identifier |
| `name` | `string` | Display name |
| `slug` | `string` | URL-friendly identifier |
| `parent_id` | `number \| null` | ID of parent taxonomy (null for top-level) |
| `created_at` | `string` | ISO 8601 timestamp |

### Category-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string \| null` | Optional description |

### Cuisine-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string \| null` | Optional description |
| `flag_url` | `string \| null` | URL to flag image (optional) |

### Palate Fields

Palates only include the common fields (no additional fields).

---

## API Endpoints

### Categories

#### GET `/api/v1/categories/get-categories`

Fetch all categories with optional filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parentOnly` | `boolean` | No | If `true`, returns only top-level categories |
| `parentId` | `number \| "null"` | No | Filter by parent ID. Use `"null"` for top-level items |
| `search` | `string` | No | Search by name or slug (case-insensitive) |

**Example Request:**

```bash
# Get all categories
GET /api/v1/categories/get-categories

# Get only parent categories
GET /api/v1/categories/get-categories?parentOnly=true

# Get children of a specific parent
GET /api/v1/categories/get-categories?parentId=1

# Search categories
GET /api/v1/categories/get-categories?search=italian
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Fine Dining",
      "slug": "fine-dining",
      "description": "Upscale dining experiences",
      "parent_id": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Casual Dining",
      "slug": "casual-dining",
      "description": "Relaxed dining atmosphere",
      "parent_id": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

#### GET `/api/v1/categories/get-category-by-id`

Fetch a single category by ID.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | Category ID |

**Example Request:**

```bash
GET /api/v1/categories/get-category-by-id?id=1
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "name": "Fine Dining",
    "slug": "fine-dining",
    "description": "Upscale dining experiences",
    "parent_id": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "fetchedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### Cuisines

#### GET `/api/v1/cuisines/get-cuisines`

Fetch all cuisines with optional filtering.

**Query Parameters:**

Same as Categories endpoint.

**Example Request:**

```bash
# Get all cuisines
GET /api/v1/cuisines/get-cuisines

# Get only parent cuisines
GET /api/v1/cuisines/get-cuisines?parentOnly=true

# Get children of a specific parent
GET /api/v1/cuisines/get-cuisines?parentId=1

# Search cuisines
GET /api/v1/cuisines/get-cuisines?search=japanese
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Italian",
      "slug": "italian",
      "description": "Traditional Italian cuisine",
      "parent_id": null,
      "flag_url": "https://example.com/flags/italy.png",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Japanese",
      "slug": "japanese",
      "description": "Authentic Japanese dishes",
      "parent_id": null,
      "flag_url": "https://example.com/flags/japan.png",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

#### GET `/api/v1/cuisines/get-cuisine-by-id`

Fetch a single cuisine by ID.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | Cuisine ID |

**Example Request:**

```bash
GET /api/v1/cuisines/get-cuisine-by-id?id=1
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "name": "Italian",
    "slug": "italian",
    "description": "Traditional Italian cuisine",
    "parent_id": null,
    "flag_url": "https://example.com/flags/italy.png",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "fetchedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### Palates

#### GET `/api/v1/palates/get-palates`

Fetch all palates with optional filtering.

**Query Parameters:**

Same as Categories endpoint.

**Example Request:**

```bash
# Get all palates
GET /api/v1/palates/get-palates

# Get only parent palates
GET /api/v1/palates/get-palates?parentOnly=true

# Get children of a specific parent
GET /api/v1/palates/get-palates?parentId=1

# Search palates
GET /api/v1/palates/get-palates?search=spicy
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Spicy",
      "slug": "spicy",
      "parent_id": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Sweet",
      "slug": "sweet",
      "parent_id": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

#### GET `/api/v1/palates/get-palate-by-id`

Fetch a single palate by ID.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | Palate ID |

**Example Request:**

```bash
GET /api/v1/palates/get-palate-by-id?id=1
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "name": "Spicy",
    "slug": "spicy",
    "parent_id": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "fetchedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

## Service Layer

The service layer provides a clean, type-safe interface for accessing taxonomy data. Use these services in your client-side code for better type safety and error handling.

### Category Service

```typescript
import { categoryService } from '@/app/api/v1/services/categoryService';

// Get all categories
const response = await categoryService.getAllCategories();

// Get only parent categories
const parents = await categoryService.getParentCategories();

// Get categories with filters
const filtered = await categoryService.getAllCategories({
  parentId: 1,
  search: 'dining'
});

// Get single category
const category = await categoryService.getCategoryById(1);
```

### Cuisine Service

```typescript
import { cuisineService } from '@/app/api/v1/services/cuisineService';

// Get all cuisines
const response = await cuisineService.getAllCuisines();

// Get only parent cuisines
const parents = await cuisineService.getParentCuisines();

// Get cuisines with filters
const filtered = await cuisineService.getAllCuisines({
  parentId: null,
  search: 'asian'
});

// Get single cuisine
const cuisine = await cuisineService.getCuisineById(1);
```

### Palate Service

```typescript
import { palateService } from '@/app/api/v1/services/palateService';

// Get all palates
const response = await palateService.getAllPalates();

// Get only parent palates
const parents = await palateService.getParentPalates();

// Get palates with filters
const filtered = await palateService.getAllPalates({
  parentId: null,
  search: 'spicy'
});

// Get single palate
const palate = await palateService.getPalateById(1);
```

---

## Type Definitions

### Category Types

```typescript
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  created_at: string;
}

export interface CategoriesResponse {
  data: Category[];
  meta: {
    total: number;
    fetchedAt?: string;
  };
}
```

### Cuisine Types

```typescript
export interface Cuisine {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  flag_url?: string | null;
  created_at: string;
}

export interface CuisinesResponse {
  data: Cuisine[];
  meta: {
    total: number;
    fetchedAt?: string;
  };
}
```

### Palate Types

```typescript
export interface Palate {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  created_at: string;
}

export interface PalatesResponse {
  data: Palate[];
  meta: {
    total: number;
    fetchedAt?: string;
  };
}
```

---

## Usage Examples

### React Component Example

```typescript
'use client';
import { useState, useEffect } from 'react';
import { cuisineService, type Cuisine } from '@/app/api/v1/services/cuisineService';

export function CuisineSelector() {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        setLoading(true);
        const response = await cuisineService.getParentCuisines();
        setCuisines(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cuisines');
      } finally {
        setLoading(false);
      }
    };

    fetchCuisines();
  }, []);

  if (loading) return <div>Loading cuisines...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Select Cuisine</h2>
      <select>
        {cuisines.map((cuisine) => (
          <option key={cuisine.id} value={cuisine.id}>
            {cuisine.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Fetch API Example

```typescript
// Fetch all parent cuisines
async function fetchParentCuisines() {
  const response = await fetch('/api/v1/cuisines/get-cuisines?parentOnly=true');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data; // Array of Cuisine objects
}

// Fetch cuisine by ID
async function fetchCuisineById(id: number) {
  const response = await fetch(`/api/v1/cuisines/get-cuisine-by-id?id=${id}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data; // Single Cuisine object
}

// Search cuisines
async function searchCuisines(searchTerm: string) {
  const response = await fetch(
    `/api/v1/cuisines/get-cuisines?search=${encodeURIComponent(searchTerm)}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data; // Array of matching Cuisine objects
}
```

### Next.js Server Component Example

```typescript
import { categoryService } from '@/app/api/v1/services/categoryService';

export default async function CategoriesPage() {
  const response = await categoryService.getParentCategories();
  const categories = response.data;

  return (
    <div>
      <h1>Restaurant Categories</h1>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <a href={`/categories/${category.slug}`}>
              {category.name}
            </a>
            {category.description && (
              <p>{category.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Hierarchical Structure

All taxonomies support hierarchical (parent-child) relationships. This allows for organized categorization:

### Structure Example

```
Italian (parent, id: 1)
├── Northern Italian (child, parent_id: 1)
├── Southern Italian (child, parent_id: 1)
└── Tuscan (child, parent_id: 1)
```

### Working with Hierarchies

#### Get Parent Items Only

```typescript
// Get only top-level items (no parent)
const parents = await cuisineService.getParentCuisines();
// Returns only items where parent_id is null
```

#### Get Children of a Parent

```typescript
// Get all children of Italian cuisine (id: 1)
const children = await cuisineService.getAllCuisines({
  parentId: 1
});
// Returns only items where parent_id === 1
```

#### Build Full Hierarchy

```typescript
async function buildCuisineHierarchy() {
  // Get all parent cuisines
  const parentsResponse = await cuisineService.getParentCuisines();
  const parents = parentsResponse.data;

  // For each parent, get its children
  const hierarchy = await Promise.all(
    parents.map(async (parent) => {
      const childrenResponse = await cuisineService.getAllCuisines({
        parentId: parent.id
      });
      return {
        ...parent,
        children: childrenResponse.data
      };
    })
  );

  return hierarchy;
}
```

---

## Filtering and Search

### Search Functionality

All taxonomy endpoints support case-insensitive search on `name` and `slug` fields:

```typescript
// Search for cuisines containing "asian"
const response = await cuisineService.getAllCuisines({
  search: 'asian'
});
// Returns: ["Asian", "South Asian", "East Asian", etc.]
```

### Filtering by Parent

```typescript
// Get all top-level items
const topLevel = await cuisineService.getAllCuisines({
  parentId: null
});

// Get all children of a specific parent
const children = await cuisineService.getAllCuisines({
  parentId: 5
});
```

### Combining Filters

```typescript
// Search within children of a specific parent
const filtered = await cuisineService.getAllCuisines({
  parentId: 1,
  search: 'northern'
});
// Returns children of parent (id: 1) that match "northern"
```

---

## Best Practices

### 1. Use Service Layer

Always use the service layer instead of direct fetch calls for:
- Type safety
- Consistent error handling
- Easier refactoring
- Better code organization

```typescript
// ✅ Good
const cuisines = await cuisineService.getAllCuisines();

// ❌ Avoid
const response = await fetch('/api/v1/cuisines/get-cuisines');
const data = await response.json();
```

### 2. Cache Taxonomy Data

Taxonomy data changes infrequently. Consider caching:

```typescript
// Simple in-memory cache
let cachedCuisines: Cuisine[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedCuisines() {
  const now = Date.now();
  if (cachedCuisines && (now - cacheTime) < CACHE_DURATION) {
    return cachedCuisines;
  }

  const response = await cuisineService.getAllCuisines();
  cachedCuisines = response.data;
  cacheTime = now;
  return cachedCuisines;
}
```

### 3. Handle Loading States

Always handle loading and error states:

```typescript
const [cuisines, setCuisines] = useState<Cuisine[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cuisineService.getAllCuisines();
      setCuisines(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### 4. Use TypeScript Types

Import and use the provided TypeScript interfaces:

```typescript
import type { Cuisine, CuisinesResponse } from '@/app/api/v1/services/cuisineService';
```

### 5. Error Handling

Always handle errors gracefully:

```typescript
try {
  const response = await cuisineService.getAllCuisines();
  // Use response.data
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to fetch cuisines:', error.message);
    // Show user-friendly error message
  }
}
```

### 6. Optimize for Public Use

For public-facing applications:
- Fetch parent items first (lighter payload)
- Load children on-demand (when user expands a category)
- Use search for better UX
- Cache aggressively (taxonomy data is relatively static)

---

## Error Handling

### Standard Error Response

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message",
  "message": "Detailed error message",
  "details": [
    {
      "message": "Specific error detail",
      "extensions": {
        "code": "error-code"
      }
    }
  ]
}
```

### HTTP Status Codes

| Status Code | Meaning |
|------------|---------|
| `200` | Success |
| `400` | Bad Request (invalid parameters) |
| `404` | Not Found (resource doesn't exist) |
| `500` | Internal Server Error |

### Error Handling Example

```typescript
async function fetchCuisinesSafely() {
  try {
    const response = await cuisineService.getAllCuisines();
    return { success: true, data: response.data };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('404')) {
        return { success: false, error: 'Cuisines not found' };
      }
      if (error.message.includes('500')) {
        return { success: false, error: 'Server error. Please try again later.' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}
```

---

## Database Alignment

### Table Structures

The API endpoints align with the following database tables:

#### `restaurant_categories`

```sql
CREATE TABLE restaurant_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES restaurant_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `restaurant_cuisines`

```sql
CREATE TABLE restaurant_cuisines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES restaurant_cuisines(id) ON DELETE CASCADE,
  flag_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `restaurant_palates`

```sql
CREATE TABLE restaurant_palates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES restaurant_palates(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Consistency

- All taxonomy entries are managed through the admin portal
- The public API provides read-only access to ensure data consistency
- Changes made in the admin portal are immediately available through the public API
- No caching delays - data is always current

---

## Summary

### Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/categories/get-categories` | GET | List all categories |
| `/api/v1/categories/get-category-by-id` | GET | Get single category |
| `/api/v1/cuisines/get-cuisines` | GET | List all cuisines |
| `/api/v1/cuisines/get-cuisine-by-id` | GET | Get single cuisine |
| `/api/v1/palates/get-palates` | GET | List all palates |
| `/api/v1/palates/get-palate-by-id` | GET | Get single palate |

### Key Features

✅ **Read-Only Access** - Safe for public use  
✅ **Type-Safe** - Full TypeScript support  
✅ **Hierarchical** - Parent-child relationships  
✅ **Searchable** - Built-in search functionality  
✅ **Filterable** - Filter by parent, search term  
✅ **Service Layer** - Clean abstraction for client code  
✅ **Consistent** - Aligned with database structure  

---

## Support

For questions or issues with the taxonomy API:

1. Check this guide first
2. Review the service layer code for examples
3. Verify database structure matches expected schema
4. Ensure API endpoints are accessible from your client

---

**Last Updated:** 2024-01-01  
**API Version:** v1  
**Access Level:** Public (Read-Only)

