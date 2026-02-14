# Location Taxonomy Migration Guide

This document provides a comprehensive guide for migrating the location system from client-side constants to a database-driven taxonomy structure.

## Table of Contents

1. [Overview](#overview)
2. [Current vs New System](#current-vs-new-system)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [GraphQL Queries](#graphql-queries)
6. [Service Layer](#service-layer)
7. [Frontend Integration](#frontend-integration)
8. [Migration Path](#migration-path)
9. [Data Seeding](#data-seeding)
10. [Testing & Validation](#testing--validation)
11. [Usage Examples](#usage-examples)

---

## Overview

### Purpose

Convert the location management system from static client-side constants to a dynamic, database-driven taxonomy that follows the same pattern as cuisines, categories, and palates.

### Benefits

✅ **Dynamic Management**: Add/edit locations without code changes  
✅ **Scalability**: Easily expand to new countries and cities  
✅ **Consistency**: Follows established taxonomy pattern  
✅ **Admin UI**: Manage locations through admin interface  
✅ **Better Filtering**: Enhanced location-based restaurant filtering  
✅ **Data Integrity**: Database constraints ensure data quality  

### Key Changes

- **From**: `src/constants/location.ts` (hardcoded)
- **To**: `restaurant_locations` table (database-driven)
- **Structure**: Country (parent) → City (child) hierarchy
- **Pattern**: Follows existing taxonomy management pattern

---

## Current vs New System

### Current System (Client-Side)

**File**: `src/constants/location.ts`

```typescript
export const LOCATION_HIERARCHY: { countries: CountryLocation[] } = {
  countries: [
    {
      key: "canada",
      label: "Canada", 
      shortLabel: "CA",
      flag: "https://flagcdn.com/ca.svg",
      currency: "CAD",
      timezone: "America/Toronto",
      type: 'country',
      cities: [
        {
          key: "toronto",
          label: "Toronto",
          shortLabel: "TO",
          parentKey: "canada",
          coordinates: { lat: 43.6532, lng: -79.3832 },
          type: 'city',
          // ...
        }
      ]
    }
  ]
};
```

**Limitations**:
- ❌ Requires code deployment to add new locations
- ❌ No admin UI for management
- ❌ Not scalable for many locations
- ❌ No version control for location changes
- ❌ Duplicate data across different parts of codebase

### New System (Database-Driven)

**Table**: `restaurant_locations`

```sql
CREATE TABLE restaurant_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('country', 'city')),
  parent_id INTEGER REFERENCES restaurant_locations(id),
  short_label VARCHAR(10),
  flag_url VARCHAR(500),
  currency VARCHAR(10),
  timezone VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Advantages**:
- ✅ Dynamic location management
- ✅ Admin UI integration
- ✅ Scalable architecture
- ✅ Database constraints
- ✅ Single source of truth

---

## Database Schema

### 1. Core Location Table

**Table Name**: `restaurant_locations`

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(255) | Display name (e.g., "Canada", "Toronto") |
| `slug` | VARCHAR(255) | URL-friendly identifier (e.g., "canada", "toronto") |
| `type` | VARCHAR(50) | Location type: 'country' or 'city' |
| `parent_id` | INTEGER | Reference to parent location (NULL for countries) |
| `short_label` | VARCHAR(10) | Short code (e.g., "CA", "TO") |
| `flag_url` | VARCHAR(500) | URL to flag image |
| `currency` | VARCHAR(10) | Currency code (e.g., "CAD", "USD") |
| `timezone` | VARCHAR(100) | Timezone identifier (e.g., "America/Toronto") |
| `latitude` | DECIMAL(10,8) | Geographic latitude (for cities) |
| `longitude` | DECIMAL(11,8) | Geographic longitude (for cities) |
| `is_active` | BOOLEAN | Whether location is active |
| `display_order` | INTEGER | Custom sort order in UI |
| `description` | TEXT | Optional description |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### 2. Junction Table (Restaurant-Location)

**Table Name**: `restaurant_location_assignments`

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `restaurant_uuid` | UUID | Restaurant identifier |
| `location_id` | INTEGER | Location ID (FK to restaurant_locations) |
| `is_primary` | BOOLEAN | Whether this is the primary location |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraint**: `(restaurant_uuid, location_id)`

### 3. Indexes

```sql
-- Hierarchical queries
CREATE INDEX idx_restaurant_locations_parent_id 
  ON restaurant_locations(parent_id);

-- Slug lookups
CREATE INDEX idx_restaurant_locations_slug 
  ON restaurant_locations(slug);

-- Type filtering
CREATE INDEX idx_restaurant_locations_type 
  ON restaurant_locations(type);

-- Active locations
CREATE INDEX idx_restaurant_locations_active_type 
  ON restaurant_locations(is_active, type, display_order);

-- Coordinate-based queries
CREATE INDEX idx_restaurant_locations_coordinates 
  ON restaurant_locations(latitude, longitude)
  WHERE latitude IS NOT NULL;

-- Restaurant assignments
CREATE INDEX idx_restaurant_location_assignments_location 
  ON restaurant_location_assignments(location_id);

CREATE INDEX idx_restaurant_location_assignments_restaurant 
  ON restaurant_location_assignments(restaurant_uuid);
```

---

## API Endpoints

Following the standard taxonomy pattern, create these endpoints under `/api/v1/locations/`:

### Endpoint Structure

```
/api/v1/locations/
├── get-locations/route.ts          # Get all locations
├── get-location-by-id/route.ts     # Get single location
├── create-location/route.ts         # Create new location (admin)
├── update-location/route.ts         # Update location (admin)
└── delete-location/route.ts         # Delete location (admin)
```

### 1. Get All Locations

**Endpoint**: `GET /api/v1/locations/get-locations`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `parentOnly` | boolean | If true, return only countries |
| `parentId` | number | Filter by parent country ID |
| `type` | string | Filter by type ('country' or 'city') |
| `search` | string | Search by name or slug |
| `isActive` | boolean | Filter by active status |

**Example Requests**:

```bash
# Get all locations
GET /api/v1/locations/get-locations

# Get only countries
GET /api/v1/locations/get-locations?parentOnly=true

# Get cities in Canada (parent_id = 1)
GET /api/v1/locations/get-locations?parentId=1

# Get only active cities
GET /api/v1/locations/get-locations?type=city&isActive=true

# Search for "Toronto"
GET /api/v1/locations/get-locations?search=toronto
```

**Response**:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Canada",
      "slug": "canada",
      "type": "country",
      "parent_id": null,
      "short_label": "CA",
      "flag_url": "https://flagcdn.com/ca.svg",
      "currency": "CAD",
      "timezone": "America/Toronto",
      "latitude": null,
      "longitude": null,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Toronto",
      "slug": "toronto",
      "type": "city",
      "parent_id": 1,
      "short_label": "TO",
      "flag_url": "https://flagcdn.com/ca.svg",
      "currency": "CAD",
      "timezone": "America/Toronto",
      "latitude": 43.6532,
      "longitude": -79.3832,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

### 2. Get Location by ID

**Endpoint**: `GET /api/v1/locations/get-location-by-id`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Location ID |

**Example Request**:

```bash
GET /api/v1/locations/get-location-by-id?id=2
```

**Response**:

```json
{
  "data": {
    "id": 2,
    "name": "Toronto",
    "slug": "toronto",
    "type": "city",
    "parent_id": 1,
    "short_label": "TO",
    "flag_url": "https://flagcdn.com/ca.svg",
    "currency": "CAD",
    "timezone": "America/Toronto",
    "latitude": 43.6532,
    "longitude": -79.3832,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "fetchedAt": "2024-01-15T12:00:00Z"
  }
}
```

### 3. Create Location (Admin Only)

**Endpoint**: `POST /api/v1/locations/create-location`

**Request Body**:

```json
{
  "name": "Ottawa",
  "slug": "ottawa",
  "type": "city",
  "parent_id": 1,
  "short_label": "OTT",
  "flag_url": "https://flagcdn.com/ca.svg",
  "currency": "CAD",
  "timezone": "America/Toronto",
  "latitude": 45.4215,
  "longitude": -75.6972,
  "is_active": true,
  "display_order": 5
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Ottawa",
    "slug": "ottawa",
    "type": "city",
    "parent_id": 1
  }
}
```

### 4. Update Location (Admin Only)

**Endpoint**: `PUT /api/v1/locations/update-location`

**Request Body**:

```json
{
  "id": 15,
  "name": "Ottawa",
  "is_active": false
}
```

### 5. Delete Location (Admin Only)

**Endpoint**: `DELETE /api/v1/locations/delete-location`

**Request Body**:

```json
{
  "id": 15
}
```

---

## GraphQL Queries

Create these queries in `src/app/graphql/Attributes/locationQueries.ts`:

### 1. Get All Locations

```typescript
import { gql } from 'graphql-tag';

export const GET_ALL_LOCATIONS = gql`
  query GetAllLocations {
    restaurant_locations(order_by: { display_order: asc, name: asc }) {
      id
      name
      slug
      type
      parent_id
      short_label
      flag_url
      currency
      timezone
      latitude
      longitude
      is_active
      description
      display_order
      created_at
    }
  }
`;
```

### 2. Get Parent Locations (Countries)

```typescript
export const GET_PARENT_LOCATIONS = gql`
  query GetParentLocations {
    restaurant_locations(
      where: { parent_id: { _is_null: true }, is_active: { _eq: true } }
      order_by: { display_order: asc, name: asc }
    ) {
      id
      name
      slug
      type
      short_label
      flag_url
      currency
      timezone
      is_active
      created_at
    }
  }
`;
```

### 3. Get Cities by Country

```typescript
export const GET_CITIES_BY_COUNTRY = gql`
  query GetCitiesByCountry($parentId: Int!) {
    restaurant_locations(
      where: { parent_id: { _eq: $parentId }, type: { _eq: "city" }, is_active: { _eq: true } }
      order_by: { display_order: asc, name: asc }
    ) {
      id
      name
      slug
      type
      short_label
      latitude
      longitude
      timezone
      currency
      flag_url
      created_at
    }
  }
`;
```

### 4. Get Location by ID

```typescript
export const GET_LOCATION_BY_ID = gql`
  query GetLocationById($id: Int!) {
    restaurant_locations_by_pk(id: $id) {
      id
      name
      slug
      type
      parent_id
      short_label
      flag_url
      currency
      timezone
      latitude
      longitude
      is_active
      description
      display_order
      created_at
      updated_at
    }
  }
`;
```

### 5. Get Location with Children

```typescript
export const GET_LOCATION_WITH_CHILDREN = gql`
  query GetLocationWithChildren($id: Int!) {
    restaurant_locations_by_pk(id: $id) {
      id
      name
      slug
      type
      short_label
      flag_url
      currency
      timezone
      children: restaurant_locations(
        where: { parent_id: { _eq: $id }, is_active: { _eq: true } }
        order_by: { display_order: asc, name: asc }
      ) {
        id
        name
        slug
        type
        short_label
        latitude
        longitude
      }
    }
  }
`;
```

### 6. Create Location (Mutation)

```typescript
export const CREATE_LOCATION = gql`
  mutation CreateLocation($object: restaurant_locations_insert_input!) {
    insert_restaurant_locations_one(object: $object) {
      id
      name
      slug
      type
      parent_id
      short_label
      flag_url
      currency
      timezone
      latitude
      longitude
      is_active
      created_at
    }
  }
`;
```

### 7. Update Location (Mutation)

```typescript
export const UPDATE_LOCATION = gql`
  mutation UpdateLocation($id: Int!, $set: restaurant_locations_set_input!) {
    update_restaurant_locations_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      slug
      type
      updated_at
    }
  }
`;
```

### 8. Delete Location (Mutation)

```typescript
export const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: Int!) {
    delete_restaurant_locations_by_pk(id: $id) {
      id
      name
    }
  }
`;
```

---

## Service Layer

Create `src/app/api/v1/services/locationService.ts`:

```typescript
import { Location, LocationsResponse } from '@/interfaces/location';

export interface LocationFilters {
  parentOnly?: boolean;
  parentId?: number | null;
  type?: 'country' | 'city';
  search?: string;
  isActive?: boolean;
}

class LocationService {
  private baseUrl = '/api/v1/locations';

  /**
   * Get all locations with optional filters
   */
  async getAllLocations(filters?: LocationFilters): Promise<LocationsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.parentOnly) params.append('parentOnly', 'true');
    if (filters?.parentId !== undefined) params.append('parentId', String(filters.parentId));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const response = await fetch(`${this.baseUrl}/get-locations?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get only parent locations (countries)
   */
  async getCountries(): Promise<LocationsResponse> {
    return this.getAllLocations({ parentOnly: true, isActive: true });
  }

  /**
   * Get cities by country ID
   */
  async getCitiesByCountry(countryId: number): Promise<LocationsResponse> {
    return this.getAllLocations({ parentId: countryId, type: 'city', isActive: true });
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: number): Promise<{ data: Location; meta: { fetchedAt: string } }> {
    const response = await fetch(`${this.baseUrl}/get-location-by-id?id=${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch location: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get location by slug
   */
  async getLocationBySlug(slug: string): Promise<Location | null> {
    const response = await this.getAllLocations({ search: slug });
    const location = response.data.find(loc => loc.slug === slug);
    return location || null;
  }

  /**
   * Build hierarchical location structure (countries with cities)
   */
  async getHierarchy(): Promise<Array<Location & { children: Location[] }>> {
    const countriesResponse = await this.getCountries();
    const countries = countriesResponse.data;

    const hierarchy = await Promise.all(
      countries.map(async (country) => {
        const citiesResponse = await this.getCitiesByCountry(country.id);
        return {
          ...country,
          children: citiesResponse.data
        };
      })
    );

    return hierarchy;
  }
}

export const locationService = new LocationService();
export type { Location, LocationsResponse };
```

---

## Frontend Integration

### 1. Type Definitions

Create/Update `src/interfaces/location.ts`:

```typescript
export interface Location {
  id: number;
  name: string;
  slug: string;
  type: 'country' | 'city';
  parent_id: number | null;
  short_label?: string | null;
  flag_url?: string | null;
  currency?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  description?: string | null;
  display_order?: number;
  created_at: string;
  updated_at?: string;
}

export interface LocationWithChildren extends Location {
  children?: Location[];
}

export interface LocationsResponse {
  data: Location[];
  meta: {
    total: number;
    fetchedAt?: string;
  };
}

// For backward compatibility with existing code
export interface LocationOption {
  key: string; // Will map to slug
  label: string; // Will map to name
  shortLabel: string; // Will map to short_label
  flag: string; // Will map to flag_url
  currency: string;
  timezone: string;
  type: 'country' | 'city';
  parentKey?: string; // Will be derived from parent_id
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Helper to convert database Location to LocationOption
export function locationToOption(location: Location, parentSlug?: string): LocationOption {
  return {
    key: location.slug,
    label: location.name,
    shortLabel: location.short_label || location.slug.substring(0, 2).toUpperCase(),
    flag: location.flag_url || '',
    currency: location.currency || 'USD',
    timezone: location.timezone || 'UTC',
    type: location.type,
    parentKey: parentSlug,
    coordinates: location.latitude && location.longitude 
      ? { lat: location.latitude, lng: location.longitude }
      : undefined
  };
}
```

### 2. Location Context Provider

Create `src/contexts/LocationContext.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locationService } from '@/app/api/v1/services/locationService';
import { Location, LocationWithChildren } from '@/interfaces/location';

interface LocationContextType {
  locations: LocationWithChildren[];
  loading: boolean;
  error: string | null;
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<LocationWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const hierarchy = await locationService.getHierarchy();
      setLocations(hierarchy);
      
      // Auto-select Toronto by default if no selection
      if (!selectedLocation) {
        const toronto = hierarchy
          .flatMap(country => country.children || [])
          .find(city => city.slug === 'toronto');
        if (toronto) {
          setSelectedLocation(toronto);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        locations,
        loading,
        error,
        selectedLocation,
        setSelectedLocation,
        refreshLocations: fetchLocations
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocations must be used within LocationProvider');
  }
  return context;
}
```

### 3. Location Selector Component

Create `src/components/location/LocationSelector.tsx`:

```typescript
'use client';

import React, { useState } from 'react';
import { useLocations } from '@/contexts/LocationContext';
import { Location } from '@/interfaces/location';

export function LocationSelector() {
  const { locations, loading, selectedLocation, setSelectedLocation } = useLocations();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return <div>Loading locations...</div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
      >
        {selectedLocation?.flag_url && (
          <img src={selectedLocation.flag_url} alt="" className="w-5 h-3" />
        )}
        <span>{selectedLocation?.name || 'Select Location'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
          {locations.map(country => (
            <div key={country.id} className="border-b last:border-b-0">
              <div className="px-4 py-2 bg-gray-50 font-medium flex items-center gap-2">
                {country.flag_url && (
                  <img src={country.flag_url} alt="" className="w-5 h-3" />
                )}
                {country.name}
              </div>
              {country.children?.map(city => (
                <button
                  key={city.id}
                  onClick={() => {
                    setSelectedLocation(city);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-6 py-2 hover:bg-gray-50 ${
                    selectedLocation?.id === city.id ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Migration Path

### Phase 1: Database Setup

1. **Run SQL Migration**
   ```bash
   # Run the schema file in Hasura Console or via CLI
   psql $DATABASE_URL -f database/migrations/location_taxonomy_schema.sql
   ```

2. **Verify Tables**
   ```sql
   SELECT * FROM restaurant_locations WHERE type = 'country';
   SELECT * FROM restaurant_locations WHERE type = 'city';
   ```

3. **Configure Hasura Permissions**
   - Grant `select` permission to `user` role on `restaurant_locations`
   - Grant all permissions to `admin` role

### Phase 2: API Implementation

1. **Create API Routes**
   - `src/app/api/v1/locations/get-locations/route.ts`
   - `src/app/api/v1/locations/get-location-by-id/route.ts`
   - Admin routes (create, update, delete)

2. **Create Service Layer**
   - `src/app/api/v1/services/locationService.ts`

3. **Create GraphQL Queries**
   - `src/app/graphql/Attributes/locationQueries.ts`

### Phase 3: Frontend Integration

1. **Update Type Definitions**
   - `src/interfaces/location.ts`

2. **Create Context Provider**
   - `src/contexts/LocationContext.tsx`

3. **Create UI Components**
   - `src/components/location/LocationSelector.tsx`
   - `src/components/location/LocationFilter.tsx`

### Phase 4: Gradual Migration

1. **Keep Existing Constants (Temporary)**
   ```typescript
   // src/constants/location.ts
   // Keep for backward compatibility during migration
   ```

2. **Create Adapter Layer**
   ```typescript
   // src/utils/locationAdapter.ts
   export async function getLocationHierarchy() {
     // Fetch from database
     const locations = await locationService.getHierarchy();
     
     // Convert to old format for backward compatibility
     return convertToLegacyFormat(locations);
   }
   ```

3. **Update Components Gradually**
   - Start with new features
   - Migrate existing components one by one
   - Test thoroughly after each migration

### Phase 5: Data Migration

1. **Assign Locations to Existing Restaurants**
   ```typescript
   // Script to match restaurants with locations based on googleMapUrl
   async function migrateRestaurantLocations() {
     const restaurants = await getAllRestaurants();
     const locations = await locationService.getAllLocations();
     
     for (const restaurant of restaurants) {
       const matchedLocation = matchLocationByAddress(
         restaurant.googleMapUrl,
         locations.data
       );
       
       if (matchedLocation) {
         await assignLocationToRestaurant(
           restaurant.uuid,
           matchedLocation.id
         );
       }
     }
   }
   ```

### Phase 6: Cleanup

1. **Remove Old Constants**
   - Delete `src/constants/location.ts`
   - Remove `LOCATION_HIERARCHY` references

2. **Update Documentation**
   - Update README
   - Update API documentation

3. **Deploy**
   - Test in staging
   - Deploy to production
   - Monitor for issues

---

## Data Seeding

The SQL schema includes seed data for:

### Countries (5 total)
- 🇨🇦 Canada
- 🇲🇾 Malaysia
- 🇭🇰 Hong Kong
- 🇨🇳 China
- 🇵🇭 Philippines

### Cities (18 total)

**Canada** (4 cities):
- Toronto
- Vancouver
- Montreal
- Calgary

**Malaysia** (2 cities):
- Kuala Lumpur
- Penang

**Hong Kong** (3 districts):
- Hong Kong Island
- Kowloon
- New Territories

**China** (3 cities):
- Beijing
- Shanghai
- Guangzhou

**Philippines** (2 cities):
- Manila
- Cebu

### Adding More Locations

Use the admin API or insert directly:

```sql
-- Add a new country
INSERT INTO restaurant_locations (name, slug, type, short_label, flag_url, currency, timezone, display_order)
VALUES ('United States', 'united-states', 'country', 'US', 'https://flagcdn.com/us.svg', 'USD', 'America/New_York', 6);

-- Add a city to that country
INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order)
SELECT 'New York', 'new-york', 'city', 'NYC', id, 'https://flagcdn.com/us.svg', 'USD', 'America/New_York', 40.7128, -74.0060, 1
FROM restaurant_locations WHERE slug = 'united-states';
```

---

## Testing & Validation

### 1. Database Tests

```sql
-- Test hierarchical structure
SELECT 
  CASE WHEN parent_id IS NULL THEN name ELSE '  ├── ' || name END AS location,
  type,
  short_label
FROM restaurant_locations
ORDER BY COALESCE(parent_id, id), CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END;

-- Test coordinate data
SELECT name, type, latitude, longitude 
FROM restaurant_locations 
WHERE latitude IS NOT NULL;

-- Test active locations
SELECT COUNT(*), type 
FROM restaurant_locations 
WHERE is_active = TRUE 
GROUP BY type;
```

### 2. API Tests

```typescript
// Test location service
describe('LocationService', () => {
  it('should fetch all countries', async () => {
    const response = await locationService.getCountries();
    expect(response.data).toHaveLength(5);
    expect(response.data[0].type).toBe('country');
  });

  it('should fetch cities by country', async () => {
    const response = await locationService.getCitiesByCountry(1); // Canada
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data[0].type).toBe('city');
    expect(response.data[0].parent_id).toBe(1);
  });

  it('should build hierarchy', async () => {
    const hierarchy = await locationService.getHierarchy();
    expect(hierarchy.length).toBeGreaterThan(0);
    expect(hierarchy[0].children).toBeDefined();
  });
});
```

### 3. Integration Tests

```typescript
// Test location filtering
describe('Restaurant Location Filtering', () => {
  it('should filter restaurants by city', async () => {
    const toronto = await locationService.getLocationBySlug('toronto');
    const restaurants = await getRestaurantsByLocation(toronto!.id);
    
    // Verify all restaurants are in Toronto
    restaurants.forEach(restaurant => {
      expect(restaurant.location_id).toBe(toronto!.id);
    });
  });

  it('should filter restaurants by country', async () => {
    const canada = await locationService.getLocationBySlug('canada');
    const restaurants = await getRestaurantsByLocation(canada!.id);
    
    // Verify all restaurants are in Canada or its cities
    restaurants.forEach(restaurant => {
      expect(
        restaurant.location.parent_id === canada!.id || 
        restaurant.location.id === canada!.id
      ).toBeTruthy();
    });
  });
});
```

---

## Usage Examples

### Example 1: Fetch and Display Countries

```typescript
import { locationService } from '@/app/api/v1/services/locationService';

async function CountryList() {
  const response = await locationService.getCountries();
  const countries = response.data;

  return (
    <div>
      <h2>Select a Country</h2>
      <ul>
        {countries.map(country => (
          <li key={country.id}>
            <img src={country.flag_url} alt={country.name} />
            <span>{country.name}</span>
            <small>({country.currency})</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 2: Build Location Hierarchy

```typescript
import { locationService } from '@/app/api/v1/services/locationService';

async function LocationTree() {
  const hierarchy = await locationService.getHierarchy();

  return (
    <div>
      {hierarchy.map(country => (
        <div key={country.id}>
          <h3>{country.name}</h3>
          <ul>
            {country.children?.map(city => (
              <li key={city.id}>
                {city.name}
                {city.latitude && city.longitude && (
                  <small> ({city.latitude}, {city.longitude})</small>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Filter Restaurants by Location

```typescript
import { useLocations } from '@/contexts/LocationContext';
import { useRestaurants } from '@/hooks/useRestaurants';

function RestaurantList() {
  const { selectedLocation } = useLocations();
  const { restaurants, loading } = useRestaurants({
    locationId: selectedLocation?.id
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Restaurants in {selectedLocation?.name}</h2>
      <div className="grid grid-cols-3 gap-4">
        {restaurants.map(restaurant => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Location-Based Search

```typescript
import { locationService } from '@/app/api/v1/services/locationService';

async function searchLocations(query: string) {
  const response = await locationService.getAllLocations({
    search: query,
    isActive: true
  });

  return response.data;
}

// Usage
const torontoResults = await searchLocations('toronto');
// Returns cities/countries matching "toronto"
```

### Example 5: Get Nearby Cities (by Coordinates)

```typescript
import { locationService } from '@/app/api/v1/services/locationService';
import { calculateDistance } from '@/utils/locationUtils';

async function findNearbyCities(lat: number, lng: number, radiusKm: number = 100) {
  const response = await locationService.getAllLocations({ type: 'city' });
  const cities = response.data;

  const nearby = cities.filter(city => {
    if (!city.latitude || !city.longitude) return false;
    
    const distance = calculateDistance(
      { lat, lng },
      { lat: city.latitude, lng: city.longitude }
    );
    
    return distance <= radiusKm;
  });

  return nearby.sort((a, b) => {
    const distA = calculateDistance({ lat, lng }, { lat: a.latitude!, lng: a.longitude! });
    const distB = calculateDistance({ lat, lng }, { lat: b.latitude!, lng: b.longitude! });
    return distA - distB;
  });
}
```

---

## Summary

### What You Get

✅ **Database-Driven**: Dynamic location management  
✅ **Hierarchical**: Country → City structure  
✅ **Scalable**: Easy to add new locations  
✅ **Admin UI Ready**: Following existing taxonomy pattern  
✅ **Type-Safe**: Full TypeScript support  
✅ **Well-Indexed**: Optimized for performance  
✅ **Backward Compatible**: Migration path from existing constants  

### Next Steps

1. ✅ Run SQL migration: `location_taxonomy_schema.sql`
2. ⏳ Create API endpoints following pattern
3. ⏳ Implement service layer
4. ⏳ Create UI components
5. ⏳ Migrate existing features
6. ⏳ Test thoroughly
7. ⏳ Deploy to production

### Support

Refer to:
- [Taxonomy Management Guide](./taxonomy_guide.md) for general patterns
- [Public Taxonomy API Guide](../hasura/public_taxonomy_guide.md) for API patterns
- SQL Schema: `database/migrations/location_taxonomy_schema.sql`

---

**Last Updated**: 2024-01-31  
**Migration Status**: Ready for Implementation  
**Estimated Time**: 2-3 days for full migration
