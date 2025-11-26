# API Guidelines - Hasura Integration with Next.js

This document provides comprehensive guidelines for implementing RESTful API endpoints using Next.js API Routes with Hasura GraphQL as the backend data layer. These guidelines are based on the `/api/v1` pattern used in this project.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Hasura Server Client](#hasura-server-client)
5. [API Route Conventions](#api-route-conventions)
6. [Request/Response Formats](#requestresponse-formats)
7. [Error Handling](#error-handling)
8. [GraphQL Query Patterns](#graphql-query-patterns)
9. [Service Layer](#service-layer)
10. [Type Definitions](#type-definitions)
11. [Best Practices](#best-practices)
12. [Code Templates](#code-templates)
13. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Core Principles

1. **RESTful Design**: All endpoints follow REST conventions (GET, POST, PUT, DELETE)
2. **Hasura Integration**: All database operations go through Hasura GraphQL
3. **Type Safety**: Full TypeScript support throughout
4. **Consistent Structure**: Standardized patterns for all resources
5. **Error Handling**: Comprehensive error handling with meaningful messages
6. **Service Layer**: Frontend services abstract API complexity

### API Base Path

All API endpoints are prefixed with `/api/v1/`:

```
/api/v1/{resource}/{action}
```

---

## Architecture

```
┌─────────────────┐
│  Frontend       │
│  Components     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service Layer  │
│  (TypeScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hasura Client  │
│  (Server-side)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hasura GraphQL │
│  Engine         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  Database       │
└─────────────────┘
```

---

## Directory Structure

### API Routes Structure

```
src/app/api/v1/
├── {resource}/
│   ├── get-{resource}s/
│   │   └── route.ts          # GET - List all items
│   ├── get-{resource}-by-id/
│   │   └── route.ts          # GET - Get single item
│   ├── create-{resource}/
│   │   └── route.ts          # POST - Create new item
│   ├── update-{resource}/
│   │   └── route.ts          # PUT - Update existing item
│   └── delete-{resource}/
│       └── route.ts          # DELETE - Delete item
└── services/
    └── {resource}Service.ts   # Frontend service layer
```

### GraphQL Queries Structure

```
src/app/graphql/
├── hasura-server-client.ts   # Server-side Hasura client
├── Attributes/
│   ├── {resource}Queries.ts  # Resource-specific queries
└── Restaurant/
    └── hasuraRestaurantQueries.ts
```

### Example: Complete Resource Structure

```
src/app/api/v1/
├── cuisines/
│   ├── get-cuisines/
│   │   └── route.ts
│   ├── get-cuisine-by-id/
│   │   └── route.ts
│   ├── create-cuisine/
│   │   └── route.ts
│   ├── update-cuisine/
│   │   └── route.ts
│   └── delete-cuisine/
│       └── route.ts
└── services/
    └── cuisineService.ts
```

---

## Hasura Server Client

### Setup

Create `src/app/graphql/hasura-server-client.ts`:

```typescript
// hasura-server-client.ts - Server-side Hasura GraphQL client for API routes
const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL;
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET;

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

export async function hasuraQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  if (!HASURA_URL) {
    throw new Error('NEXT_PUBLIC_HASURA_GRAPHQL_API_URL is not configured');
  }

  const response = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET || '',
    },
    body: JSON.stringify({
      query,
      variables: variables || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Hasura request failed: ${response.status}`);
  }

  const result: GraphQLResponse<T> = await response.json();
  return result;
}

export async function hasuraMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  return hasuraQuery<T>(mutation, variables);
}
```

### Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_HASURA_GRAPHQL_API_URL=https://your-hasura-instance.com/v1/graphql
NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret-here
```

---

## API Route Conventions

### Standard HTTP Methods

| Method | Endpoint Pattern | Purpose |
|--------|------------------|---------|
| GET | `/api/v1/{resource}/get-{resource}s` | List all items (with pagination/filtering) |
| GET | `/api/v1/{resource}/get-{resource}-by-id` | Get single item by ID |
| POST | `/api/v1/{resource}/create-{resource}` | Create new item |
| PUT | `/api/v1/{resource}/update-{resource}` | Update existing item |
| DELETE | `/api/v1/{resource}/delete-{resource}` | Delete item |

### Route File Structure

Every route file exports the HTTP method handler:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery, hasuraMutation } from '@/app/graphql/hasura-server-client';

export async function GET(request: NextRequest) {
  // Implementation
}

export async function POST(request: NextRequest) {
  // Implementation
}

export async function PUT(request: NextRequest) {
  // Implementation
}

export async function DELETE(request: NextRequest) {
  // Implementation
}
```

---

## Request/Response Formats

### Standard Response Structure

#### Success Response

```typescript
{
  success: true,
  data: { /* resource data */ },
  meta?: { /* pagination/metadata */ }
}
```

#### Error Response

```typescript
{
  success: false,
  error: "Error message",
  details?: [ /* error details */ ]
}
```

### GET - List All Items

**Request:**
```
GET /api/v1/{resource}/get-{resource}s?limit=100&offset=0&search=term&status=active
```

**Query Parameters:**
- `limit` (number, optional): Number of items per page (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)
- `search` (string, optional): Search term
- `status` (string, optional): Filter by status
- `parentId` (number, optional): Filter by parent ID
- `parentOnly` (boolean, optional): Only return parent items

**Response:**
```typescript
{
  data: Resource[],
  meta: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean,
    fetchedAt: string
  }
}
```

### GET - Get Single Item

**Request:**
```
GET /api/v1/{resource}/get-{resource}-by-id?id=123
```

**Query Parameters:**
- `id` (number, required): Resource ID

**Response:**
```typescript
{
  data: Resource
}
```

### POST - Create Item

**Request:**
```
POST /api/v1/{resource}/create-{resource}
Content-Type: application/json

{
  "name": "Resource Name",
  "slug": "resource-name", // Optional, auto-generated if not provided
  // ... other fields
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: number,
    // ... created resource fields
  }
}
```

### PUT - Update Item

**Request:**
```
PUT /api/v1/{resource}/update-{resource}
Content-Type: application/json

{
  "id": 123,
  "name": "Updated Name",
  // ... fields to update (all optional except id)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: number,
    // ... updated resource fields
  }
}
```

### DELETE - Delete Item

**Request:**
```
DELETE /api/v1/{resource}/delete-{resource}?id=123
```

**Query Parameters:**
- `id` (number, required): Resource ID

**Response:**
```typescript
{
  success: true,
  data: {
    id: number,
    // ... deleted resource fields
  }
}
```

---

## Error Handling

### Standard Error Handling Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validation
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    // Hasura query
    const result = await hasuraQuery(QUERY_STRING, { id: parseInt(id) });

    // Check for GraphQL errors
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Operation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    // Check for data
    const resource = result.data?.resource_by_pk;
    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      data: resource
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
```

### HTTP Status Codes

| Status Code | Usage |
|------------|-------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Successful POST (creation) |
| 400 | Bad Request (validation errors) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## GraphQL Query Patterns

### Query Structure

Store queries in `src/app/graphql/Attributes/{resource}Queries.ts`:

```typescript
// For client-side usage (with gql tag)
import { gql } from '@apollo/client';

export const GET_ALL_RESOURCES = gql`
  query GetAllResources($where: resources_bool_exp, $order_by: [resources_order_by!], $limit: Int, $offset: Int) {
    resources(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      name
      slug
      created_at
    }
    resources_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// For server-side usage (plain string)
import { print } from 'graphql';

export const GET_ALL_RESOURCES_STRING = print(GET_ALL_RESOURCES);
```

### Common Query Patterns

#### List Query with Relationships

```typescript
export const GET_ALL_RESOURCES = `
  query GetAllResources($where: resources_bool_exp, $order_by: [resources_order_by!], $limit: Int, $offset: Int) {
    resources(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      name
      slug
      parent_id
      parent {
        id
        name
      }
      children {
        id
        name
      }
      created_at
    }
    resources_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
```

#### Single Item Query

```typescript
export const GET_RESOURCE_BY_ID = `
  query GetResourceById($id: Int!) {
    resources_by_pk(id: $id) {
      id
      name
      slug
      # ... all fields
    }
  }
`;
```

#### Create Mutation

```typescript
export const CREATE_RESOURCE = `
  mutation CreateResource($object: resources_insert_input!) {
    insert_resources_one(object: $object) {
      id
      name
      slug
      created_at
    }
  }
`;
```

#### Update Mutation

```typescript
export const UPDATE_RESOURCE = `
  mutation UpdateResource($id: Int!, $changes: resources_set_input!) {
    update_resources_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      name
      slug
      updated_at
    }
  }
`;
```

#### Delete Mutation

```typescript
export const DELETE_RESOURCE = `
  mutation DeleteResource($id: Int!) {
    delete_resources_by_pk(id: $id) {
      id
      name
    }
  }
`;
```

### Where Clause Patterns

```typescript
// Simple equality
const where = { status: { _eq: 'active' } };

// Null check
const where = { parent_id: { _is_null: true } };

// Search (multiple fields)
const where = {
  _or: [
    { name: { _ilike: `%${search}%` } },
    { slug: { _ilike: `%${search}%` } }
  ]
};

// Combined conditions
const where = {
  status: { _eq: 'active' },
  parent_id: { _is_null: true },
  _or: [
    { name: { _ilike: `%${search}%` } },
    { slug: { _ilike: `%${search}%` } }
  ]
};
```

---

## Service Layer

### Service Class Structure

Create services in `src/app/api/v1/services/{resource}Service.ts`:

```typescript
export interface Resource {
  id: number;
  name: string;
  slug: string;
  // ... other fields
}

export interface ResourcesResponse {
  data: Resource[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
}

export interface CreateResourceRequest {
  name: string;
  slug?: string;
  // ... other optional fields
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  id: number;
}

class ResourceService {
  private baseUrl: string = '/api/v1/resources';

  async getAllResources(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }): Promise<ResourcesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const url = `${this.baseUrl}/get-resources${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch resources: ${response.statusText}`);
    }

    return response.json();
  }

  async getResourceById(id: number): Promise<{ data: Resource }> {
    const response = await fetch(`${this.baseUrl}/get-resource-by-id?id=${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch resource: ${response.statusText}`);
    }

    return response.json();
  }

  async createResource(data: CreateResourceRequest): Promise<{
    success: boolean;
    data?: Resource;
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/create-resource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create resource: ${response.statusText}`);
    }

    return response.json();
  }

  async updateResource(id: number, data: Omit<UpdateResourceRequest, 'id'>): Promise<{
    success: boolean;
    data?: Resource;
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/update-resource`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update resource: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteResource(id: number): Promise<{
    success: boolean;
    data?: { id: number; name: string };
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/delete-resource?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete resource: ${response.statusText}`);
    }

    return response.json();
  }
}

export const resourceService = new ResourceService();
```

---

## Type Definitions

### Resource Types

Define types in the service file or separate types file:

```typescript
// Base resource interface
export interface Resource {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  created_at: string;
  updated_at?: string;
}

// Request types
export interface CreateResourceRequest {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  id: number;
}

// Response types
export interface ResourcesResponse {
  data: Resource[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    fetchedAt?: string;
  };
}
```

---

## Best Practices

### 1. Slug Generation

Always provide a helper function for slug generation:

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### 2. Slug Uniqueness

Check and ensure unique slugs:

```typescript
async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const whereClause: any = { slug: { _eq: slug } };
  if (excludeId) {
    whereClause.id = { _neq: excludeId };
  }

  const CHECK_SLUG_QUERY = `
    query CheckSlugExists($where: resources_bool_exp!) {
      resources(where: $where, limit: 1) {
        id
      }
    }
  `;

  const result = await hasuraQuery(CHECK_SLUG_QUERY, { where: whereClause });
  return (result.data?.resources?.length || 0) > 0;
}

async function generateUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let candidateSlug = baseSlug;
  let counter = 1;

  while (await slugExists(candidateSlug, excludeId)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug;
}
```

### 3. Optional Field Handling

Use conditional spreading for optional fields:

```typescript
const resourceObject: any = {
  name,
  slug,
  ...(description && { description }),
  ...(parent_id !== undefined && { parent_id: parent_id === null ? null : parseInt(parent_id) }),
};
```

### 4. Relationship Handling

Handle many-to-many relationships separately:

```typescript
// After creating main resource
if (related_ids && Array.isArray(related_ids) && related_ids.length > 0) {
  for (const relatedId of related_ids) {
    try {
      await hasuraMutation(`
        mutation CreateRelationship($resource_id: Int!, $related_id: Int!) {
          insert_resource_relationships_one(
            object: { resource_id: $resource_id, related_id: $related_id }
          ) {
            id
          }
        }
      `, {
        resource_id: resource.id,
        related_id: parseInt(relatedId)
      });
    } catch (err) {
      console.warn(`Failed to assign relationship ${relatedId}:`, err);
    }
  }
}
```

### 5. Data Transformation

Transform Hasura response to match frontend expectations:

```typescript
function transformResource(resource: any) {
  return {
    ...resource,
    related_items: resource.resource_relationships?.map((rel: any) => ({
      id: rel.related_item.id,
      name: rel.related_item.name,
      slug: rel.related_item.slug
    })) || []
  };
}
```

### 6. Fallback Queries

Provide fallback queries for missing relationships:

```typescript
// Try with relationships first
let result = await hasuraQuery(GET_ALL_RESOURCES_WITH_RELATIONS, variables);

// If relationship errors occur, fall back to simpler query
if (result.errors && result.errors.some((err: any) => 
  err.message?.includes('relationship')
)) {
  console.log('Relationship not configured, using fallback query');
  result = await hasuraQuery(GET_ALL_RESOURCES_SIMPLE, variables);
}
```

### 7. UUID Generation

Use UUIDs for public-facing identifiers:

```typescript
import { randomUUID } from 'crypto';

const resourceUuid = randomUUID();
```

### 8. Input Validation

Always validate required fields:

```typescript
if (!name) {
  return NextResponse.json(
    { success: false, error: 'Name is required' },
    { status: 400 }
  );
}
```

### 9. Error Logging

Log errors for debugging:

```typescript
catch (error) {
  console.error('API Error:', error);
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    },
    { status: 500 }
  );
}
```

### 10. Type Safety

Use TypeScript interfaces throughout:

```typescript
interface Resource {
  id: number;
  name: string;
  // ...
}

const resource: Resource = result.data?.resource_by_pk;
```

---

## Code Templates

### Complete GET Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_RESOURCES_STRING } from '@/app/graphql/Attributes/resourceQueries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build where clause
    let where: any = {};
    
    if (status) {
      where.status = { _eq: status };
    }

    if (search) {
      where._or = [
        { name: { _ilike: `%${search}%` } },
        { slug: { _ilike: `%${search}%` } }
      ];
    }

    const variables = {
      limit,
      offset,
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: { created_at: 'desc' }
    };

    const result = await hasuraQuery(GET_ALL_RESOURCES_STRING, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        { error: 'Failed to fetch resources', details: result.errors },
        { status: 500 }
      );
    }

    const resources = result.data?.resources || [];
    const total = result.data?.resources_aggregate?.aggregate?.count || resources.length;

    return NextResponse.json({
      data: resources,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get Resources API Error:', error);
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

### Complete POST Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { CREATE_RESOURCE_STRING } from '@/app/graphql/Attributes/resourceQueries';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, parent_id } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const resourceSlug = slug || generateSlug(name);

    const result = await hasuraMutation(CREATE_RESOURCE_STRING, {
      object: {
        name,
        slug: resourceSlug,
        ...(description && { description }),
        ...(parent_id !== undefined && { parent_id: parent_id === null ? null : parseInt(parent_id) })
      }
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to create resource',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const resource = result.data?.insert_resources_one;

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Failed to create resource - no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resource
    });

  } catch (error) {
    console.error('Create Resource API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
```

### Complete PUT Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { UPDATE_RESOURCE_STRING } from '@/app/graphql/Attributes/resourceQueries';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, parent_id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    const resourceId = parseInt(id);
    const changes: any = {};
    
    if (name) changes.name = name;
    if (slug) changes.slug = slug;
    if (description !== undefined) changes.description = description;
    if (parent_id !== undefined) {
      changes.parent_id = parent_id === null ? null : parseInt(parent_id);
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const result = await hasuraMutation(UPDATE_RESOURCE_STRING, {
      id: resourceId,
      changes
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to update resource',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const resource = result.data?.update_resources_by_pk;

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resource
    });

  } catch (error) {
    console.error('Update Resource API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
```

### Complete DELETE Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { DELETE_RESOURCE_STRING } from '@/app/graphql/Attributes/resourceQueries';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    const result = await hasuraMutation(DELETE_RESOURCE_STRING, {
      id: parseInt(id)
    });

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0]?.message || 'Failed to delete resource',
          details: result.errors
        },
        { status: 500 }
      );
    }

    const deletedResource = result.data?.delete_resources_by_pk;

    if (!deletedResource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedResource
    });

  } catch (error) {
    console.error('Delete Resource API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
```

---

## Implementation Checklist

### Phase 1: Setup

- [ ] Create Hasura server client (`hasura-server-client.ts`)
- [ ] Configure environment variables
- [ ] Set up GraphQL queries directory structure
- [ ] Create types directory structure

### Phase 2: GraphQL Queries

- [ ] Create resource queries file
- [ ] Define GET_ALL query with relationships
- [ ] Define GET_BY_ID query
- [ ] Define CREATE mutation
- [ ] Define UPDATE mutation
- [ ] Define DELETE mutation
- [ ] Create string exports for server-side usage

### Phase 3: API Routes

- [ ] Create route directory structure
- [ ] Implement GET (list) route
- [ ] Implement GET (by ID) route
- [ ] Implement POST (create) route
- [ ] Implement PUT (update) route
- [ ] Implement DELETE route
- [ ] Add slug generation helpers
- [ ] Add slug uniqueness checks
- [ ] Add error handling

### Phase 4: Service Layer

- [ ] Create service class
- [ ] Define TypeScript interfaces
- [ ] Implement getAllResources method
- [ ] Implement getResourceById method
- [ ] Implement createResource method
- [ ] Implement updateResource method
- [ ] Implement deleteResource method
- [ ] Export service instance

### Phase 5: Testing

- [ ] Test GET (list) endpoint
- [ ] Test GET (by ID) endpoint
- [ ] Test POST (create) endpoint
- [ ] Test PUT (update) endpoint
- [ ] Test DELETE endpoint
- [ ] Test error cases
- [ ] Test pagination
- [ ] Test filtering
- [ ] Test search functionality

### Phase 6: Documentation

- [ ] Document API endpoints
- [ ] Document request/response formats
- [ ] Document error codes
- [ ] Add code examples
- [ ] Update this guidelines document if needed

---

## Additional Resources

### Hasura Documentation

- [Hasura GraphQL API](https://hasura.io/docs/latest/graphql/core/index.html)
- [Hasura Queries](https://hasura.io/docs/latest/graphql/core/queries/index.html)
- [Hasura Mutations](https://hasura.io/docs/latest/graphql/core/mutations/index.html)
- [Hasura Where Clauses](https://hasura.io/docs/latest/graphql/core/queries/query-filters.html)

### Next.js Documentation

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

## Conclusion

This guide provides a comprehensive framework for implementing RESTful APIs with Hasura GraphQL in Next.js. Follow these patterns consistently to maintain code quality, type safety, and developer experience across your project.

For questions or improvements to these guidelines, please update this document accordingly.

