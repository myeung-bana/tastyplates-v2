# Taxonomy Management Guide

This guide provides a standardized approach for creating taxonomy and attribute management pages throughout the application. It documents the pattern used for managing hierarchical attributes like cuisines, palates, and other taxonomies.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema Pattern](#database-schema-pattern)
3. [API Endpoints Structure](#api-endpoints-structure)
4. [Service Layer Pattern](#service-layer-pattern)
5. [GraphQL Queries Pattern](#graphql-queries-pattern)
6. [Page Structure](#page-structure)
7. [UI Components and Patterns](#ui-components-and-patterns)
8. [Implementation Checklist](#implementation-checklist)
9. [Example: Cuisine Management](#example-cuisine-management)

---

## Overview

Taxonomy management pages follow a consistent pattern for CRUD operations on hierarchical attributes. The pattern includes:

- **List Page**: Display all items with hierarchical/flat views, search, and filtering
- **Create Page**: Dedicated page for creating new taxonomy items
- **Edit Page**: Dedicated page for editing existing taxonomy items
- **API Endpoints**: RESTful API endpoints for all operations
- **Service Layer**: Frontend service for API communication
- **GraphQL Queries**: Hasura GraphQL queries for data operations

---

## Database Schema Pattern

### Base Table Structure

All taxonomy tables should follow this pattern:

```sql
CREATE TABLE IF NOT EXISTS {taxonomy_name} (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER REFERENCES {taxonomy_name}(id) ON DELETE CASCADE,
  -- Additional fields specific to taxonomy type
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for hierarchical queries
CREATE INDEX idx_{taxonomy_name}_parent_id ON {taxonomy_name}(parent_id);
CREATE INDEX idx_{taxonomy_name}_slug ON {taxonomy_name}(slug);
```

### Key Principles

1. **Self-Referencing Foreign Key**: `parent_id` references the same table for hierarchical relationships
2. **Cascade Delete**: Deleting a parent automatically deletes children
3. **Unique Slug**: Ensures URL-friendly identifiers are unique
4. **Timestamps**: Track creation and update times

### Example: Cuisine Table

```sql
CREATE TABLE IF NOT EXISTS restaurant_cuisines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER REFERENCES restaurant_cuisines(id) ON DELETE CASCADE,
  flag_url TEXT, -- Taxonomy-specific field
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints Structure

### Endpoint Pattern

All taxonomy APIs follow this structure under `/api/v1/{taxonomy_plural}/`:

```
/api/v1/{taxonomy_plural}/
├── route.ts                    # Main GET endpoint (optional)
├── get-{taxonomy_plural}/route.ts      # Get all items
├── get-{taxonomy}-by-id/route.ts        # Get single item
├── create-{taxonomy}/route.ts            # Create new item
├── update-{taxonomy}/route.ts            # Update existing item
└── delete-{taxonomy}/route.ts            # Delete item
```

### Standard Endpoint Implementations

#### 1. Get All Items (`get-{taxonomy_plural}/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_ALL_{TAXONOMY_UPPER}, GET_PARENT_{TAXONOMY_UPPER} } from '@/app/graphql/Attributes/{taxonomy}Queries';
import { print } from 'graphql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get('parentOnly') === 'true';
    const parentId = searchParams.get('parentId');
    const search = searchParams.get('search');

    const queryString = parentOnly ? print(GET_PARENT_{TAXONOMY_UPPER}) : print(GET_ALL_{TAXONOMY_UPPER});
    const result = await hasuraQuery(queryString);
    
    if (result.errors) {
      return NextResponse.json({
        error: 'Failed to fetch {taxonomy_plural}',
        details: result.errors
      }, { status: 500 });
    }

    let items = result.data?.{taxonomy_table} || [];

    // Filter by parentId if provided (and not using parentOnly)
    if (!parentOnly && parentId) {
      items = items.filter((item: any) => item.parent_id === parseInt(parentId));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter((item: any) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.slug.toLowerCase().includes(searchLower)
      );
    }

    const transformed = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      parent_id: item.parent_id,
      // Add taxonomy-specific fields
      created_at: item.created_at
    }));

    return NextResponse.json({
      data: transformed,
      meta: { total: transformed.length }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

#### 2. Get Item by ID (`get-{taxonomy}-by-id/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_{TAXONOMY_UPPER}_BY_ID } from '@/app/graphql/Attributes/{taxonomy}Queries';
import { print } from 'graphql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        error: '{Taxonomy} ID is required'
      }, { status: 400 });
    }

    const queryString = print(GET_{TAXONOMY_UPPER}_BY_ID);
    const result = await hasuraQuery(queryString, { id: parseInt(id) });

    if (result.errors) {
      return NextResponse.json({
        error: 'Failed to fetch {taxonomy}',
        details: result.errors
      }, { status: 500 });
    }

    if (!result.data?.{taxonomy_table}_by_pk) {
      return NextResponse.json({
        error: '{Taxonomy} not found'
      }, { status: 404 });
    }

    const item = result.data.{taxonomy_table}_by_pk;

    return NextResponse.json({
      data: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        parent_id: item.parent_id,
        // Add taxonomy-specific fields
        created_at: item.created_at
      },
      meta: { fetchedAt: new Date().toISOString() }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

#### 3. Create Item (`create-{taxonomy}/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { CREATE_{TAXONOMY_UPPER} } from '@/app/graphql/Attributes/{taxonomy}Queries';
import { print } from 'graphql';

export interface Create{Taxonomy}Request {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  // Add taxonomy-specific fields
}

export interface Create{Taxonomy}Response {
  success: boolean;
  data?: {
    id: number;
    name: string;
    slug: string;
    // Add taxonomy-specific fields
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<Create{Taxonomy}Response>> {
  try {
    const body: Create{Taxonomy}Request = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const mutationString = print(CREATE_{TAXONOMY_UPPER});
    const result = await hasuraMutation(mutationString, {
      object: {
        name: body.name,
        slug: slug,
        description: body.description || null,
        parent_id: body.parent_id || null,
        // Add taxonomy-specific fields
      }
    });

    if (result.errors) {
      return NextResponse.json(
        { success: false, error: result.errors[0].message },
        { status: 500 }
      );
    }

    const item = result.data?.insert_{taxonomy_table}_one;
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Failed to create {taxonomy}' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        // Add taxonomy-specific fields
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 4. Update Item (`update-{taxonomy}/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { UPDATE_{TAXONOMY_UPPER} } from '@/app/graphql/Attributes/{taxonomy}Queries';
import { print } from 'graphql';

export interface Update{Taxonomy}Request {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  // Add taxonomy-specific fields
}

export interface Update{Taxonomy}Response {
  success: boolean;
  data?: {
    id: number;
    name: string;
    slug: string;
    // Add taxonomy-specific fields
  };
  error?: string;
}

export async function PUT(request: NextRequest): Promise<NextResponse<Update{Taxonomy}Response>> {
  try {
    const body: Update{Taxonomy}Request = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: '{Taxonomy} ID is required' },
        { status: 400 }
      );
    }

    const changes: any = {};
    if (body.name !== undefined) changes.name = body.name;
    if (body.slug !== undefined) changes.slug = body.slug;
    if (body.description !== undefined) changes.description = body.description || null;
    if (body.parent_id !== undefined) changes.parent_id = body.parent_id;
    // Add taxonomy-specific field updates

    const mutationString = print(UPDATE_{TAXONOMY_UPPER});
    const result = await hasuraMutation(mutationString, {
      id: body.id,
      changes
    });

    if (result.errors) {
      return NextResponse.json(
        { success: false, error: result.errors[0].message },
        { status: 500 }
      );
    }

    const item = result.data?.update_{taxonomy_table}_by_pk;
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Failed to update {taxonomy}' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        // Add taxonomy-specific fields
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 5. Delete Item (`delete-{taxonomy}/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hasuraMutation } from '@/app/graphql/hasura-server-client';
import { DELETE_{TAXONOMY_UPPER} } from '@/app/graphql/Attributes/{taxonomy}Queries';
import { print } from 'graphql';

export interface Delete{Taxonomy}Response {
  success: boolean;
  data?: {
    id: number;
    name: string;
  };
  error?: string;
}

export async function DELETE(request: NextRequest): Promise<NextResponse<Delete{Taxonomy}Response>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '{Taxonomy} ID is required' },
        { status: 400 }
      );
    }

    const mutationString = print(DELETE_{TAXONOMY_UPPER});
    const result = await hasuraMutation(mutationString, { id: parseInt(id) });

    if (result.errors) {
      return NextResponse.json(
        { success: false, error: result.errors[0].message },
        { status: 500 }
      );
    }

    const deleted = result.data?.delete_{taxonomy_table}_by_pk;
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete {taxonomy}' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: deleted.id,
        name: deleted.name
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Service Layer Pattern

### Service File Structure

Create a service file at `/src/app/api/v1/services/{taxonomy}Service.ts`:

```typescript
// {Taxonomy} service for frontend consumption
export interface {Taxonomy} {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  // Add taxonomy-specific fields
  created_at: string;
}

export interface {Taxonomy}Response {
  data: {Taxonomy}[];
  meta: {
    total: number;
    fetchedAt?: string;
  };
}

export interface {Taxonomy}SingleResponse {
  data: {Taxonomy};
  meta: {
    fetchedAt: string;
  };
}

export interface Create{Taxonomy}Request {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  // Add taxonomy-specific fields
}

export interface Update{Taxonomy}Request {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  // Add taxonomy-specific fields
}

class {Taxonomy}Service {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/v1/{taxonomy_plural}';
  }

  /**
   * Get all {taxonomy_plural}
   */
  async getAll{TaxonomyPlural}(params?: {
    parentId?: number | null;
    search?: string;
  }): Promise<{Taxonomy}Response> {
    const searchParams = new URLSearchParams();
    if (params?.parentId !== undefined) {
      searchParams.append('parentId', params.parentId?.toString() || 'null');
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }

    const url = `${this.baseUrl}/get-{taxonomy_plural}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch {taxonomy_plural}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get only parent {taxonomy_plural}
   */
  async getParent{TaxonomyPlural}(): Promise<{Taxonomy}Response> {
    const url = `${this.baseUrl}/get-{taxonomy_plural}?parentOnly=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch parent {taxonomy_plural}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get children of a specific parent
   */
  async get{Taxonomy}Children(parentId: number): Promise<{Taxonomy}Response> {
    return this.getAll{TaxonomyPlural}({ parentId });
  }

  /**
   * Get {taxonomy} by ID
   */
  async get{Taxonomy}ById(id: number): Promise<{Taxonomy}SingleResponse> {
    const url = `${this.baseUrl}/get-{taxonomy}-by-id?id=${id}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('{Taxonomy} not found');
      }
      throw new Error(`Failed to fetch {taxonomy}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new {taxonomy}
   */
  async create{Taxonomy}(data: Create{Taxonomy}Request): Promise<{
    success: boolean;
    data?: {Taxonomy};
    error?: string;
  }> {
    const url = `${this.baseUrl}/create-{taxonomy}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create {taxonomy}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update a {taxonomy}
   */
  async update{Taxonomy}(id: number, data: Omit<Update{Taxonomy}Request, 'id'>): Promise<{
    success: boolean;
    data?: {Taxonomy};
    error?: string;
  }> {
    const url = `${this.baseUrl}/update-{taxonomy}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update {taxonomy}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a {taxonomy}
   */
  async delete{Taxonomy}(id: number): Promise<{
    success: boolean;
    data?: { id: number; name: string };
    error?: string;
  }> {
    const url = `${this.baseUrl}/delete-{taxonomy}?id=${id}`;
    const response = await fetch(url, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete {taxonomy}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const {taxonomy}Service = new {Taxonomy}Service();
```

---

## GraphQL Queries Pattern

### Query File Structure

Create a query file at `/src/app/graphql/Attributes/{taxonomy}Queries.ts`:

```typescript
import { gql } from '@apollo/client';

// =============================================================================
// {TAXONOMY_UPPER} QUERIES & MUTATIONS WITH HIERARCHY
// =============================================================================

// Get all {taxonomy_plural} with children (hierarchical)
export const GET_ALL_{TAXONOMY_UPPER} = gql`
  query GetAll{TaxonomyPlural} {
    {taxonomy_table}(order_by: { name: asc }) {
      id
      name
      slug
      description
      parent_id
      created_at
      # Add taxonomy-specific fields
    }
  }
`;

// Get only top-level {taxonomy_plural} (parents)
export const GET_PARENT_{TAXONOMY_UPPER} = gql`
  query GetParent{TaxonomyPlural} {
    {taxonomy_table}(
      where: { parent_id: { _is_null: true } }
      order_by: { name: asc }
    ) {
      id
      name
      slug
      description
      created_at
      # Add taxonomy-specific fields
    }
  }
`;

// Get children of a specific {taxonomy}
export const GET_{TAXONOMY_UPPER}_CHILDREN = gql`
  query Get{Taxonomy}Children($parent_id: Int!) {
    {taxonomy_table}(
      where: { parent_id: { _eq: $parent_id } }
      order_by: { name: asc }
    ) {
      id
      name
      slug
      description
      parent_id
      created_at
      # Add taxonomy-specific fields
    }
  }
`;

// Get {taxonomy} by ID
export const GET_{TAXONOMY_UPPER}_BY_ID = gql`
  query Get{Taxonomy}ById($id: Int!) {
    {taxonomy_table}_by_pk(id: $id) {
      id
      name
      slug
      description
      parent_id
      created_at
      # Add taxonomy-specific fields
    }
  }
`;

// Create {taxonomy} (with optional parent)
export const CREATE_{TAXONOMY_UPPER} = gql`
  mutation Create{Taxonomy}($object: {taxonomy_table}_insert_input!) {
    insert_{taxonomy_table}_one(object: $object) {
      id
      name
      slug
      description
      parent_id
      created_at
      # Add taxonomy-specific fields
    }
  }
`;

// Update {taxonomy} (can change parent)
export const UPDATE_{TAXONOMY_UPPER} = gql`
  mutation Update{Taxonomy}($id: Int!, $changes: {taxonomy_table}_set_input!) {
    update_{taxonomy_table}_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
      name
      slug
      description
      parent_id
      # Add taxonomy-specific fields
    }
  }
`;

// Delete {taxonomy} (cascades to children)
export const DELETE_{TAXONOMY_UPPER} = gql`
  mutation Delete{Taxonomy}($id: Int!) {
    delete_{taxonomy_table}_by_pk(id: $id) {
      id
      name
    }
  }
`;
```

### Important Notes

- **No `parent` relationship in queries**: Hasura requires manual configuration of self-referencing relationships. For now, queries only return `parent_id`, not the full parent object.
- **Table naming**: Use the actual Hasura table name (e.g., `restaurant_cuisines`, `palates`)
- **Type names**: Hasura generates types like `{table}_insert_input`, `{table}_set_input`, etc.

---

## Page Structure

### 1. List Page (`/dashboard/admin/manage-{taxonomy}/page.tsx`)

**Key Features:**
- Display all items in hierarchical or flat view
- Search functionality
- View mode toggle (hierarchical/flat)
- Expandable parent items with children
- Edit and Delete actions
- Navigation to create/edit pages

**Required State:**
```typescript
const [items, setItems] = useState<{Taxonomy}[]>([]);
const [parentItems, setParentItems] = useState<{Taxonomy}[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [viewMode, setViewMode] = useState<"hierarchical" | "flat">("hierarchical");
const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);
```

**Key Functions:**
- `fetchItems()`: Fetch all items
- `fetchParentItems()`: Fetch only parent items
- `handleDeleteClick()`: Open delete confirmation
- `handleDeleteConfirm()`: Perform deletion
- `toggleParent()`: Expand/collapse parent items

### 2. Create Page (`/dashboard/admin/manage-{taxonomy}/create/page.tsx`)

**Key Features:**
- Form for creating new items
- Parent selection dropdown
- Auto-slug generation
- Validation
- Navigation back to list on success

**Required State:**
```typescript
const [formData, setFormData] = useState({
  name: "",
  slug: "",
  description: "",
  parent_id: null as number | null,
  // Add taxonomy-specific fields
});
const [parentItems, setParentItems] = useState<{Taxonomy}[]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);
```

### 3. Edit Page (`/dashboard/admin/manage-{taxonomy}/edit/[id]/page.tsx`)

**Key Features:**
- Form pre-filled with existing data
- Parent selection (excluding self)
- Loading state while fetching
- Navigation back to list on success

**Required State:**
```typescript
const [isLoading, setIsLoading] = useState(true);
const [formData, setFormData] = useState({
  name: "",
  slug: "",
  description: "",
  parent_id: null as number | null,
  // Add taxonomy-specific fields
});
const [parentItems, setParentItems] = useState<{Taxonomy}[]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);
```

---

## UI Components and Patterns

### Standard Components

All pages use these UI components from `@/components/ui/`:

- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Button`
- `Input`
- `Label`
- `Textarea`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`
- `Badge`
- `toast` from `sonner`

### Common Patterns

#### 1. Slug Generation

```typescript
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};
```

#### 2. Hierarchical Organization

```typescript
const hierarchicalItems = useMemo(() => {
  const parents = items.filter(item => !item.parent_id);
  const childrenMap = new Map<number, {Taxonomy}[]>();
  
  items.forEach(item => {
    if (item.parent_id) {
      if (!childrenMap.has(item.parent_id)) {
        childrenMap.set(item.parent_id, []);
      }
      childrenMap.get(item.parent_id)!.push(item);
    }
  });

  return parents.map(parent => ({
    ...parent,
    children: childrenMap.get(parent.id) || []
  }));
}, [items]);
```

#### 3. Delete Confirmation Dialog

```typescript
<Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteCancel}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{itemToDelete?.name}"? 
        This will also delete all child items. This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={handleDeleteCancel} disabled={deleting}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 4. Parent Selection Dropdown

```typescript
<Select
  value={formData.parent_id?.toString() || "none"}
  onValueChange={(value) => 
    setFormData({ ...formData, parent_id: value === "none" ? null : parseInt(value) })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Select a parent (or leave empty for top-level)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">None (Top-level)</SelectItem>
    {parentItems
      .filter(p => !editingItem || p.id !== editingItem.id) // Exclude self in edit mode
      .map((parent) => (
        <SelectItem key={parent.id} value={parent.id.toString()}>
          {parent.name}
        </SelectItem>
      ))}
  </SelectContent>
</Select>
```

**Important**: Use `"none"` instead of `""` for the empty value, as SelectItem cannot have an empty string value.

---

## Implementation Checklist

When creating a new taxonomy management system, follow this checklist:

### Database Setup
- [ ] Create table with `id`, `name`, `slug`, `description`, `parent_id`, `created_at`
- [ ] Add self-referencing foreign key constraint
- [ ] Add indexes for `parent_id` and `slug`
- [ ] Add cascade delete for parent-child relationships
- [ ] Add any taxonomy-specific fields

### Hasura Configuration
- [ ] Track the table in Hasura Console
- [ ] Verify foreign key relationships are detected
- [ ] (Optional) Configure `parent` relationship if needed for nested queries

### API Endpoints
- [ ] Create `/api/v1/{taxonomy_plural}/get-{taxonomy_plural}/route.ts`
- [ ] Create `/api/v1/{taxonomy_plural}/get-{taxonomy}-by-id/route.ts`
- [ ] Create `/api/v1/{taxonomy_plural}/create-{taxonomy}/route.ts`
- [ ] Create `/api/v1/{taxonomy_plural}/update-{taxonomy}/route.ts`
- [ ] Create `/api/v1/{taxonomy_plural}/delete-{taxonomy}/route.ts`
- [ ] Test all endpoints

### GraphQL Queries
- [ ] Create `/src/app/graphql/Attributes/{taxonomy}Queries.ts`
- [ ] Define `GET_ALL_{TAXONOMY_UPPER}`
- [ ] Define `GET_PARENT_{TAXONOMY_UPPER}`
- [ ] Define `GET_{TAXONOMY_UPPER}_BY_ID`
- [ ] Define `CREATE_{TAXONOMY_UPPER}`
- [ ] Define `UPDATE_{TAXONOMY_UPPER}`
- [ ] Define `DELETE_{TAXONOMY_UPPER}`

### Service Layer
- [ ] Create `/src/app/api/v1/services/{taxonomy}Service.ts`
- [ ] Define TypeScript interfaces
- [ ] Implement all service methods
- [ ] Export service instance

### Pages
- [ ] Create `/dashboard/admin/manage-{taxonomy}/page.tsx` (List page)
- [ ] Create `/dashboard/admin/manage-{taxonomy}/create/page.tsx` (Create page)
- [ ] Create `/dashboard/admin/manage-{taxonomy}/edit/[id]/page.tsx` (Edit page)
- [ ] Add navigation links in sidebar
- [ ] Test all CRUD operations

### UI/UX
- [ ] Implement hierarchical view with expand/collapse
- [ ] Implement flat view
- [ ] Add search functionality
- [ ] Add delete confirmation dialog
- [ ] Add loading states
- [ ] Add error handling with toast notifications
- [ ] Ensure responsive design

---

## Example: Cuisine Management

The cuisine management system serves as the reference implementation for this pattern:

### Files Created

1. **Database**: `restaurant_cuisines` table with `parent_id`, `flag_url`
2. **API Endpoints**: `/api/v1/cuisines/*`
3. **Service**: `/src/app/api/v1/services/cuisineService.ts`
4. **GraphQL**: `/src/app/graphql/Attributes/attributeQueries.ts`
5. **Pages**:
   - `/dashboard/admin/manage-cuisine/page.tsx`
   - `/dashboard/admin/manage-cuisine/create/page.tsx`
   - `/dashboard/admin/manage-cuisine/edit/[id]/page.tsx`

### Key Differences for Other Taxonomies

When implementing other taxonomies (e.g., palates, tags, categories):

1. **Simpler taxonomies** (like palates) may not need:
   - `slug` field (if not used in URLs)
   - `description` field
   - `flag_url` or other custom fields

2. **More complex taxonomies** may need:
   - Additional metadata fields
   - Image uploads
   - Custom ordering
   - Color coding
   - Icon selection

### Naming Conventions

- **Table name**: `{entity}_{taxonomy_plural}` (e.g., `restaurant_cuisines`, `restaurant_palates`)
- **API path**: `/api/v1/{taxonomy_plural}` (e.g., `/api/v1/cuisines`, `/api/v1/palates`)
- **Service name**: `{taxonomy}Service` (e.g., `cuisineService`, `palateService`)
- **Page path**: `/dashboard/admin/manage-{taxonomy}` (e.g., `/dashboard/admin/manage-cuisine`)

---

## Best Practices

1. **Consistency**: Always follow the same pattern for all taxonomies
2. **Error Handling**: Use toast notifications for user feedback
3. **Loading States**: Show loading indicators during async operations
4. **Validation**: Validate required fields before submission
5. **Confirmation**: Always confirm destructive actions (delete)
6. **Navigation**: Use Next.js router for navigation, not window.location
7. **Type Safety**: Use TypeScript interfaces throughout
8. **Reusability**: Extract common functions (slug generation, etc.) to utilities
9. **Accessibility**: Ensure all interactive elements are keyboard accessible
10. **Responsive**: Design works on mobile and desktop

---

## Troubleshooting

### Common Issues

1. **"field 'parent' not found"**: Hasura relationship not configured. Remove `parent` from queries or configure relationship in Hasura Console.

2. **SelectItem empty string error**: Use `"none"` instead of `""` for empty values.

3. **Missing key prop**: Use `React.Fragment` with key for mapped fragments.

4. **Cascade delete not working**: Verify foreign key constraint has `ON DELETE CASCADE`.

5. **Slug conflicts**: Ensure unique constraint on slug column.

---

## Additional Resources

- [Hasura Relationships Documentation](https://hasura.io/docs/latest/schema/postgres/table-relationships/)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Shadcn UI Components](https://ui.shadcn.com/)

---

## Version History

- **v1.0** (2024): Initial guide based on cuisine management implementation

