# Coding Patterns & Structure Guidelines

This document outlines the coding patterns, structure, and best practices used in this codebase. Use this as a reference guide for maintaining consistency and implementing similar patterns in other projects.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [Styling System](#styling-system)
4. [TypeScript Patterns](#typescript-patterns)
5. [API Architecture](#api-architecture)
6. [File Naming Conventions](#file-naming-conventions)
7. [Code Organization Principles](#code-organization-principles)
8. [Best Practices](#best-practices)
9. [Quick Reference](#quick-reference)

---

## Project Structure

### Directory Organization

```
src/
├── app/                      # Next.js App Router (pages & API routes)
│   ├── (external)/          # Public pages (marketing, test pages)
│   ├── (main)/              # Main application with shared layout
│   │   ├── auth/            # Authentication pages
│   │   │   ├── login/
│   │   │   │   ├── _components/  # Page-specific components
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   └── dashboard/        # Dashboard pages
│   │       ├── _components/ # Shared dashboard components
│   │       ├── layout.tsx   # Route group layout
│   │       └── [feature]/   # Feature-specific pages
│   ├── api/                 # API routes
│   │   └── v1/              # Versioned API endpoints
│   │       ├── {resource}/
│   │       └── services/   # Frontend service layer
│   └── layout.tsx           # Root layout
│
├── components/              # Reusable components
│   ├── ui/                  # Base UI components (shadcn/ui)
│   ├── auth/                # Auth-specific components
│   └── [feature]/           # Feature-specific components
│
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions & helpers
├── types/                   # TypeScript type definitions
├── constants/               # Application constants
├── config/                  # Configuration files
├── navigation/              # Navigation configuration
├── middleware/              # Next.js middleware
└── server/                  # Server-only functions
```

### Key Principles

1. **Colocation**: Page-specific components live in `_components/` folders next to their pages
2. **Separation of Concerns**: Clear boundaries between UI, logic, and data layers
3. **Feature-Based Organization**: Related code grouped by feature/domain
4. **Shared vs. Specific**: Distinguish between reusable (`components/`) and page-specific (`_components/`)

---

## Component Architecture

### Component Categories

#### 1. Base UI Components (`components/ui/`)

Base UI components built on Radix UI primitives following the shadcn/ui pattern.

**Pattern:**
- One component per file
- Built on Radix UI primitives
- Uses `class-variance-authority` (CVA) for variants
- Exports compound components when needed
- Uses `data-slot` attributes for styling hooks

**Example Structure:**
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot as SlotPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { default: "...", sm: "...", lg: "..." }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button"
  
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

**Key Patterns:**
- ✅ Use `React.ComponentProps<"element">` for prop spreading
- ✅ Use `asChild` pattern for composition
- ✅ Export variants for external use
- ✅ Use `data-slot` for component identification
- ✅ Always use `cn()` utility for className merging

#### 2. Feature Components (`components/[feature]/`)

Feature-specific reusable components.

**Example:**
```typescript
// components/data-table/data-table.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DataTableProps {
  // Props definition
}

export function DataTable({ ...props }: DataTableProps) {
  // Implementation
}
```

#### 3. Page Components (`app/[route]/_components/`)

Components specific to a single page or route group.

**Naming Convention:**
- Use descriptive names: `login-form.tsx`, `dashboard-stats.tsx`
- Prefix with page name if needed: `restaurant-detail-client.tsx`

**Example Structure:**
```
app/(main)/dashboard/admin/restaurant-listings/
├── _components/
│   ├── restaurant-listings-client.tsx
│   └── restaurant-detail-client.tsx
└── page.tsx
```

### Component Patterns

#### Compound Components
```typescript
// Card component example
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("...", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("...", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("...", className)} {...props} />
}

export { Card, CardHeader, CardContent }
```

#### Client Components
Always mark client components with `"use client"` directive:
```typescript
"use client"

import * as React from "react"
// Component implementation
```

#### Server Components
Default in Next.js App Router. No directive needed:
```typescript
import { ReactNode } from "react"
// Server component implementation
```

---

## Styling System

### Tailwind CSS Configuration

**Version:** Tailwind CSS v4 with CSS variables

**Theme Configuration:**
- Colors defined as CSS custom properties in `globals.css`
- Uses OKLCH color space for better color consistency
- Semantic color names: `primary`, `secondary`, `muted`, `destructive`, etc.
- Dark mode via CSS variables

**Key Files:**
- `src/app/globals.css` - Global styles and theme variables
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration

### Styling Patterns

#### 1. Class Name Merging

Always use the `cn()` utility for conditional classes:

```typescript
import { cn } from "@/lib/utils"

function Component({ className, variant, ...props }) {
  return (
    <div
      className={cn(
        "base-classes",
        variant === "primary" && "variant-classes",
        className
      )}
      {...props}
    />
  )
}
```

#### 2. Variant Management

Use `class-variance-authority` (CVA) for component variants:

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        primary: "primary-classes",
        secondary: "secondary-classes"
      },
      size: {
        sm: "small-classes",
        md: "medium-classes",
        lg: "large-classes"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)
```

#### 3. Design Tokens

Use semantic color names from theme:
- `bg-background`, `text-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-muted`, `text-muted-foreground`
- `border-border`
- `ring-ring`

#### 4. Responsive Design

Mobile-first approach:
```typescript
className="text-sm md:text-base lg:text-lg"
```

#### 5. Dark Mode

Automatic via CSS variables. No additional classes needed:
```typescript
// Works automatically with theme variables
className="bg-background text-foreground"
```

### CSS Variable Structure

```css
:root {
  --background: oklch(...);
  --foreground: oklch(...);
  --primary: oklch(...);
  --primary-foreground: oklch(...);
  /* ... more variables */
}

.dark {
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... dark mode overrides */
}
```

---

## TypeScript Patterns

### Type Organization

**Location:** `src/types/`

**Structure:**
```
types/
├── index.ts          # Main export file
├── auth.ts           # Authentication types
├── business.ts       # Business domain types
├── navigation.ts     # Navigation types
├── components.ts     # Component prop types
└── [domain].ts       # Domain-specific types
```

**Pattern:**
```typescript
// types/auth.ts
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export type UserRole = "admin" | "user" | "guest"

// types/index.ts
export * from "./auth"
export * from "./business"
// ... other exports
```

### Type Usage Patterns

#### 1. Component Props

```typescript
// Use React.ComponentProps for HTML elements
function Button({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return <button className={cn("...", className)} {...props} />
}

// Use explicit interfaces for complex props
interface DataTableProps {
  data: Row[]
  columns: Column[]
  onRowClick?: (row: Row) => void
}

function DataTable({ data, columns, onRowClick }: DataTableProps) {
  // Implementation
}
```

#### 2. API Types

```typescript
// Request/Response types
export interface CreateRestaurantRequest {
  name: string
  address: string
  // ...
}

export interface RestaurantResponse {
  id: string
  name: string
  // ...
}
```

#### 3. Utility Types

```typescript
// Use utility types when appropriate
type PartialUser = Partial<User>
type UserKeys = keyof User
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
```

### TypeScript Configuration

**Key Settings:**
- `strict: true` - Strict type checking enabled
- Path aliases: `@/*` maps to `src/*`
- `moduleResolution: "bundler"` - For Next.js
- `jsx: "preserve"` - For React

---

## API Architecture

### RESTful API Structure

**Base Path:** `/api/v1/`

**Pattern:**
```
src/app/api/v1/
├── {resource}/
│   ├── get-{resource}s/
│   │   └── route.ts          # GET - List all
│   ├── get-{resource}-by-id/
│   │   └── route.ts          # GET - Single item
│   ├── create-{resource}/
│   │   └── route.ts          # POST - Create
│   ├── update-{resource}/
│   │   └── route.ts          # PUT - Update
│   └── delete-{resource}/
│       └── route.ts          # DELETE - Delete
└── services/
    └── {resource}Service.ts  # Frontend service layer
```

### API Route Pattern

```typescript
// src/app/api/v1/restaurants/get-restaurants/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { hasuraQuery } from '@/app/graphql/hasura-server-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Query logic
    const data = await hasuraQuery(/* ... */)

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: data.length,
        limit,
        offset
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

### Service Layer Pattern

```typescript
// src/app/api/v1/services/restaurantService.ts
export async function getRestaurants(params?: {
  limit?: number
  offset?: number
}) {
  const response = await fetch('/api/v1/restaurants/get-restaurants?...')
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result.data
}
```

### Response Format

**Success:**
```typescript
{
  success: true,
  data: T,
  meta?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: string
  details?: unknown[]
}
```

---

## File Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|-----------|---------|
| Components | `kebab-case.tsx` | `login-form.tsx`, `data-table.tsx` |
| Pages | `page.tsx` | `page.tsx` |
| Layouts | `layout.tsx` | `layout.tsx` |
| API Routes | `route.ts` | `route.ts` |
| Hooks | `use-{name}.tsx` | `use-auth.tsx`, `use-mobile.ts` |
| Utilities | `{name}.ts` | `utils.ts`, `auth.ts` |
| Types | `{domain}.ts` | `auth.ts`, `business.ts` |
| Constants | `{domain}.ts` | `routes.ts`, `roles.ts` |
| Config | `{name}-config.ts` | `app-config.ts` |

### Special Directories

- `_components/` - Page-specific components (underscore prefix)
- `(group)/` - Route groups in Next.js (parentheses)
- `[param]/` - Dynamic routes (brackets)

### Component File Structure

```typescript
// 1. Imports (external first, then internal)
import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 2. Types/Interfaces (if not exported from types/)
interface ComponentProps {
  // ...
}

// 3. Constants/Variants
const componentVariants = cva(/* ... */)

// 4. Component Implementation
function Component({ ...props }: ComponentProps) {
  // Implementation
}

// 5. Exports
export { Component, componentVariants }
```

---

## Code Organization Principles

### 1. Separation of Concerns

- **UI Components**: Pure presentation, no business logic
- **Hooks**: Business logic and state management
- **Services**: API communication
- **Utils**: Pure functions, no side effects
- **Types**: Type definitions only

### 2. Colocation

Keep related code together:
```
app/(main)/dashboard/restaurants/
├── _components/
│   ├── restaurant-list.tsx
│   └── restaurant-card.tsx
├── page.tsx
└── loading.tsx
```

### 3. Reusability Hierarchy

1. **Base UI** (`components/ui/`) - Most reusable
2. **Feature Components** (`components/[feature]/`) - Domain-specific reusable
3. **Page Components** (`_components/`) - Page-specific

### 4. Import Organization

```typescript
// 1. React and Next.js
import { ReactNode } from "react"
import { useRouter } from "next/navigation"

// 2. Third-party libraries
import { toast } from "sonner"
import { cva } from "class-variance-authority"

// 3. Internal utilities and types
import { cn } from "@/lib/utils"
import type { User } from "@/types"

// 4. Components
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 5. Relative imports (page components)
import { LoginForm } from "./_components/login-form"
```

### 5. Export Patterns

**Named Exports (Preferred):**
```typescript
export { Component, componentVariants }
export type { ComponentProps }
```

**Default Exports (Pages Only):**
```typescript
export default function Page() {
  // ...
}
```

---

## Best Practices

### Component Best Practices

1. ✅ **Always use TypeScript** - No `any` types unless absolutely necessary
2. ✅ **Use semantic HTML** - Proper element selection
3. ✅ **Accessibility first** - Use Radix UI primitives for a11y
4. ✅ **Composition over configuration** - Build complex UIs from simple components
5. ✅ **Prop spreading** - Use `React.ComponentProps` for HTML elements
6. ✅ **Conditional rendering** - Use ternary or logical operators appropriately
7. ✅ **Error boundaries** - Handle errors gracefully

### Styling Best Practices

1. ✅ **Use design tokens** - Never hardcode colors/values
2. ✅ **Mobile-first** - Start with mobile, enhance for desktop
3. ✅ **Consistent spacing** - Use Tailwind spacing scale
4. ✅ **Semantic class names** - Use meaningful utility combinations
5. ✅ **Avoid inline styles** - Use Tailwind classes
6. ✅ **Dark mode support** - Always test both themes

### TypeScript Best Practices

1. ✅ **Strict mode enabled** - Catch errors early
2. ✅ **Explicit types** - Don't rely on inference for public APIs
3. ✅ **Type organization** - Centralize types in `types/` directory
4. ✅ **Utility types** - Use built-in utility types when appropriate
5. ✅ **Type guards** - Use for runtime type checking
6. ✅ **Avoid `any`** - Use `unknown` if type is truly unknown

### API Best Practices

1. ✅ **Consistent naming** - Follow REST conventions
2. ✅ **Error handling** - Always handle errors gracefully
3. ✅ **Type safety** - Type request/response payloads
4. ✅ **Service layer** - Abstract API calls in services
5. ✅ **Versioning** - Use `/api/v1/` for versioning
6. ✅ **Standardized responses** - Consistent response format

### Performance Best Practices

1. ✅ **Server Components** - Use by default, client when needed
2. ✅ **Code splitting** - Leverage Next.js automatic code splitting
3. ✅ **Image optimization** - Use Next.js Image component
4. ✅ **Lazy loading** - Load components/data when needed
5. ✅ **Memoization** - Use `React.memo`, `useMemo`, `useCallback` appropriately

### Code Quality

1. ✅ **ESLint** - Follow linting rules
2. ✅ **Prettier** - Consistent code formatting
3. ✅ **Git hooks** - Pre-commit checks with Husky
4. ✅ **Comments** - Document complex logic, not obvious code
5. ✅ **Naming** - Use descriptive, self-documenting names

---

## Quick Reference

### Component Template

```typescript
"use client" // Only if needed

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

interface ComponentProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof componentVariants> {
  // Additional props
}

function Component({
  className,
  variant,
  ...props
}: ComponentProps) {
  return (
    <div
      data-slot="component"
      className={cn(componentVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Component, componentVariants }
```

### API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({
      success: true,
      data: {}
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

### Hook Template

```typescript
"use client"

import { useState, useEffect } from "react"

export function useCustomHook() {
  const [state, setState] = useState(null)

  useEffect(() => {
    // Effect logic
  }, [])

  return { state }
}
```

### Service Template

```typescript
export async function getResource(params?: {
  limit?: number
  offset?: number
}) {
  const response = await fetch('/api/v1/resource/get-resources?...')
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result.data
}
```

---

## Additional Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** Based on codebase analysis
**Maintained By:** Development Team
