# Post-Coding Pattern Migration Guide

**Purpose:** This document outlines the systematic migration of the codebase to align with the coding patterns defined in `documentation/coding-pattern.md`, with emphasis on security, performance, and maintainability.

**Target Audience:** AI agents and developers executing the migration

**Last Updated:** 2024

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Priority Levels](#priority-levels)
3. [Phase 1: Foundation Setup (Week 1)](#phase-1-foundation-setup-week-1)
4. [Phase 2: Component Architecture (Week 2-3)](#phase-2-component-architecture-week-2-3)
5. [Phase 3: Styling System Migration (Week 4-5)](#phase-3-styling-system-migration-week-4-5)
6. [Phase 4: Type System & Organization (Week 6)](#phase-4-type-system--organization-week-6)
7. [Phase 5: Performance Optimization (Week 7)](#phase-5-performance-optimization-week-7)
8. [Phase 6: Security Hardening (Week 8)](#phase-6-security-hardening-week-8)
9. [Validation & Testing](#validation--testing)
10. [Rollback Procedures](#rollback-procedures)

---

## Migration Overview

### Current State Analysis

**Issues Identified:**
- 35+ SCSS files mixed with Tailwind CSS
- Inconsistent component export patterns (default vs named)
- No design system or variant management (CVA)
- Types defined inline in components
- Missing `data-slot` attributes for styling hooks
- No base UI component library
- Mixed business logic and presentation
- Inconsistent import organization
- No compound component patterns

**Target State:**
- Unified Tailwind CSS with design tokens
- Consistent named exports for components
- CVA-based variant system
- Centralized type definitions
- Base UI component library (shadcn/ui pattern)
- Separation of concerns (UI/logic/data)
- Standardized import organization
- Compound component patterns

### Migration Strategy

**Approach:** Incremental, feature-by-feature migration with backward compatibility

**Principles:**
1. ✅ **Non-breaking changes** - Maintain existing functionality during migration
2. ✅ **Test-driven** - Validate each phase before proceeding
3. ✅ **Documentation** - Update docs as patterns are established
4. ✅ **Performance-first** - Optimize during migration, not after
5. ✅ **Security-first** - Audit and harden during each phase

---

## Priority Levels

### 🔴 Critical (P0) - Security & Performance
- Security vulnerabilities
- Performance bottlenecks
- Breaking functionality
- Data loss risks

### 🟠 High (P1) - Foundation
- Base UI component library
- Design system setup
- Type system organization
- Core component patterns

### 🟡 Medium (P2) - Consistency
- Styling system migration
- Component architecture
- Import organization
- File structure

### 🟢 Low (P3) - Enhancement
- Documentation
- Code quality improvements
- Developer experience
- Future-proofing

---

## Phase 1: Foundation Setup (Week 1)

### 1.1 Initialize shadcn/ui Configuration

**Priority:** P1 (High)

**Tasks:**

1. **Create `components.json`**
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "default",
     "rsc": true,
     "tsx": true,
     "tailwind": {
       "config": "tailwind.config.ts",
       "css": "src/app/globals.css",
       "baseColor": "slate",
       "cssVariables": true,
       "prefix": ""
     },
     "aliases": {
       "components": "@/components",
       "utils": "@/lib/utils",
       "ui": "@/components/ui",
       "lib": "@/lib",
       "hooks": "@/hooks"
     }
   }
   ```

2. **Install base dependencies**
   ```bash
   npm install class-variance-authority clsx tailwind-merge
   npm install -D @types/node
   ```

3. **Verify `cn()` utility exists**
   - Location: `src/lib/utils.ts`
   - Must support: `cn(...inputs: ClassValue[])`
   - Implementation: `twMerge(clsx(inputs))`

**Validation:**
- [ ] `components.json` exists and is valid
- [ ] Dependencies installed
- [ ] `cn()` utility works correctly
- [ ] Path aliases configured in `tsconfig.json`

**Security Considerations:**
- ✅ Verify all dependencies are from trusted sources
- ✅ Check for known vulnerabilities: `npm audit`
- ✅ Lock dependency versions in `package-lock.json`

**Performance Considerations:**
- ✅ `cn()` utility should be tree-shakeable
- ✅ Minimize bundle size impact of new dependencies

---

### 1.2 Create Base UI Component Library

**Priority:** P1 (High)

**Components to Create (in order):**

1. **Button Component** (`src/components/ui/button.tsx`)
   ```typescript
   "use client"
   
   import * as React from "react"
   import { Slot } from "@radix-ui/react-slot"
   import { cva, type VariantProps } from "class-variance-authority"
   import { cn } from "@/lib/utils"
   
   const buttonVariants = cva(
     "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:bg-primary/90",
           destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
           outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
           secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
           ghost: "hover:bg-accent hover:text-accent-foreground",
           link: "text-primary underline-offset-4 hover:underline",
         },
         size: {
           default: "h-10 px-4 py-2",
           sm: "h-9 rounded-md px-3",
           lg: "h-11 rounded-md px-8",
           icon: "h-10 w-10",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "default",
       },
     }
   )
   
   export interface ButtonProps
     extends React.ButtonHTMLAttributes<HTMLButtonElement>,
       VariantProps<typeof buttonVariants> {
     asChild?: boolean
   }
   
   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     ({ className, variant, size, asChild = false, ...props }, ref) => {
       const Comp = asChild ? Slot : "button"
       return (
         <Comp
           data-slot="button"
           className={cn(buttonVariants({ variant, size, className }))}
           ref={ref}
           {...props}
         />
       )
     }
   )
   Button.displayName = "Button"
   
   export { Button, buttonVariants }
   ```

2. **Card Component** (`src/components/ui/card.tsx`)
   ```typescript
   "use client"
   
   import * as React from "react"
   import { cva, type VariantProps } from "class-variance-authority"
   import { cn } from "@/lib/utils"
   
   const cardVariants = cva(
     "rounded-lg border bg-card text-card-foreground shadow-sm",
     {
       variants: {
         variant: {
           default: "border-border",
           outlined: "border-2",
           elevated: "shadow-md",
         },
       },
       defaultVariants: {
         variant: "default",
       },
     }
   )
   
   const Card = React.forwardRef<
     HTMLDivElement,
     React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
   >(({ className, variant, ...props }, ref) => (
     <div
       ref={ref}
       data-slot="card"
       className={cn(cardVariants({ variant, className }))}
       {...props}
     />
   ))
   Card.displayName = "Card"
   
   const CardHeader = React.forwardRef<
     HTMLDivElement,
     React.HTMLAttributes<HTMLDivElement>
   >(({ className, ...props }, ref) => (
     <div
       ref={ref}
       data-slot="card-header"
       className={cn("flex flex-col space-y-1.5 p-6", className)}
       {...props}
     />
   ))
   CardHeader.displayName = "CardHeader"
   
   const CardTitle = React.forwardRef<
     HTMLParagraphElement,
     React.HTMLAttributes<HTMLHeadingElement>
   >(({ className, ...props }, ref) => (
     <h3
       ref={ref}
       data-slot="card-title"
       className={cn(
         "text-2xl font-semibold leading-none tracking-tight",
         className
       )}
       {...props}
     />
   ))
   CardTitle.displayName = "CardTitle"
   
   const CardDescription = React.forwardRef<
     HTMLParagraphElement,
     React.HTMLAttributes<HTMLParagraphElement>
   >(({ className, ...props }, ref) => (
     <p
       ref={ref}
       data-slot="card-description"
       className={cn("text-sm text-muted-foreground", className)}
       {...props}
     />
   ))
   CardDescription.displayName = "CardDescription"
   
   const CardContent = React.forwardRef<
     HTMLDivElement,
     React.HTMLAttributes<HTMLDivElement>
   >(({ className, ...props }, ref) => (
     <div
       ref={ref}
       data-slot="card-content"
       className={cn("p-6 pt-0", className)}
       {...props}
     />
   ))
   CardContent.displayName = "CardContent"
   
   const CardFooter = React.forwardRef<
     HTMLDivElement,
     React.HTMLAttributes<HTMLDivElement>
   >(({ className, ...props }, ref) => (
     <div
       ref={ref}
       data-slot="card-footer"
       className={cn("flex items-center p-6 pt-0", className)}
       {...props}
     />
   ))
   CardFooter.displayName = "CardFooter"
   
   export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
   ```

3. **Input Component** (`src/components/ui/input.tsx`)
   ```typescript
   "use client"
   
   import * as React from "react"
   import { cn } from "@/lib/utils"
   
   export interface InputProps
     extends React.InputHTMLAttributes<HTMLInputElement> {}
   
   const Input = React.forwardRef<HTMLInputElement, InputProps>(
     ({ className, type, ...props }, ref) => {
       return (
         <input
           type={type}
           data-slot="input"
           className={cn(
             "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
             className
           )}
           ref={ref}
           {...props}
         />
       )
     }
   )
   Input.displayName = "Input"
   
   export { Input }
   ```

**Validation:**
- [ ] All base components created
- [ ] Components use CVA for variants
- [ ] Components have `data-slot` attributes
- [ ] Components use `React.forwardRef` for ref forwarding
- [ ] Components export variants for external use
- [ ] TypeScript types are correct
- [ ] Components are accessible (keyboard navigation, ARIA)

**Security Considerations:**
- ✅ Sanitize user inputs in Input component
- ✅ Prevent XSS in dynamic content rendering
- ✅ Validate props at runtime where necessary
- ✅ Use `React.forwardRef` to prevent ref injection attacks

**Performance Considerations:**
- ✅ Use `React.memo` for expensive components
- ✅ Lazy load components when appropriate
- ✅ Minimize re-renders with proper prop types
- ✅ Tree-shake unused variants

---

### 1.3 Centralize Type Definitions

**Priority:** P1 (High)

**Tasks:**

1. **Create type organization structure**
   ```
   src/types/
   ├── index.ts              # Main export file
   ├── restaurant.ts          # Restaurant domain types
   ├── review.ts             # Review domain types
   ├── user.ts               # User domain types
   ├── api.ts                # API request/response types
   └── components.ts         # Component prop types
   ```

2. **Migrate inline types to centralized files**

   **Example: `src/types/restaurant.ts`**
   ```typescript
   export interface Restaurant {
     id: string
     databaseId: number
     slug: string
     name: string
     image: string
     rating: number
     averageRating?: number
     ratingsCount?: number
     palatesNames?: string[]
     streetAddress?: string
     googleMapUrl?: GoogleMapUrl
     countries: string
     priceRange: string
     status?: string
   }
   
   export interface GoogleMapUrl {
     city?: string
     country?: string
     countryShort?: string
     streetAddress?: string
     streetNumber?: string
     streetName?: string
     state?: string
     stateShort?: string
     postCode?: string
     latitude?: string
     longitude?: string
     placeId?: string
     zoom?: number
   }
   
   export interface RestaurantCardProps 
     extends React.ComponentProps<"div"> {
     restaurant: Restaurant
     profileTablist?: 'listings' | 'wishlists' | 'checkin'
     initialSavedStatus?: boolean | null
     ratingsCount?: number
     onWishlistChange?: (restaurant: Restaurant, isSaved: boolean) => void
     onClick?: () => void
   }
   ```

3. **Update `src/types/index.ts`**
   ```typescript
   export * from "./restaurant"
   export * from "./review"
   export * from "./user"
   export * from "./api"
   export * from "./components"
   ```

**Validation:**
- [ ] All types moved from components to centralized files
- [ ] No duplicate type definitions
- [ ] Types properly exported from index
- [ ] Components import types from `@/types`
- [ ] TypeScript compilation succeeds

**Security Considerations:**
- ✅ Validate types at runtime for user inputs
- ✅ Use branded types for sensitive data (e.g., `UserId`, `RestaurantId`)
- ✅ Sanitize data before type assertions

**Performance Considerations:**
- ✅ Use `type` instead of `interface` where possible (smaller bundle)
- ✅ Avoid deep type nesting (performance impact)
- ✅ Use utility types for transformations

---

## Phase 2: Component Architecture (Week 2-3)

### 2.1 Migrate Reference Component: RestaurantCard

**Priority:** P1 (High)

**Migration Steps:**

1. **Extract business logic to hooks**
   - Create `src/hooks/useRestaurantCard.ts`
   - Move wishlist logic, review fetching, etc.

2. **Refactor component to use new patterns**
   ```typescript
   "use client"
   
   import * as React from "react"
   import { cva, type VariantProps } from "class-variance-authority"
   import { cn } from "@/lib/utils"
   import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
   import { Button } from "@/components/ui/button"
   import { useRestaurantCard } from "@/hooks/useRestaurantCard"
   import type { RestaurantCardProps } from "@/types/restaurant"
   import { FallbackImage } from "@/components/ui/Image/FallbackImage"
   
   const restaurantCardVariants = cva(
     "cursor-pointer transition-all hover:shadow-lg",
     {
       variants: {
         variant: {
           default: "bg-card",
           featured: "bg-primary/5 border-primary",
         },
         size: {
           sm: "p-2",
           md: "p-4",
           lg: "p-6",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "md",
       },
     }
   )
   
   export function RestaurantCard({
     restaurant,
     className,
     variant,
     size,
     profileTablist,
     initialSavedStatus,
     ratingsCount,
     onWishlistChange,
     onClick,
     ...props
   }: RestaurantCardProps & VariantProps<typeof restaurantCardVariants>) {
     const {
       saved,
       loading,
       error,
       handleToggle,
       handleClick,
       isReviewModalOpen,
       setIsReviewModalOpen,
     } = useRestaurantCard({
       restaurant,
       initialSavedStatus,
       onWishlistChange,
       onClick,
     })
   
     if (!restaurant) {
       console.warn('RestaurantCard: restaurant object is undefined or null')
       return null
     }
   
     return (
       <Card
         data-slot="restaurant-card"
         className={cn(restaurantCardVariants({ variant, size, className }))}
         onClick={handleClick}
         {...props}
       >
         <CardHeader>
           {/* Restaurant image */}
           <FallbackImage
             src={restaurant.image}
             alt={restaurant.name}
             width={300}
             height={200}
           />
         </CardHeader>
         <CardContent>
           {/* Restaurant details */}
         </CardContent>
         <CardFooter>
           {/* Actions */}
         </CardFooter>
       </Card>
     )
   }
   
   export { restaurantCardVariants }
   ```

3. **Create hook for business logic**
   ```typescript
   // src/hooks/useRestaurantCard.ts
   "use client"
   
   import { useState, useEffect, useCallback } from "react"
   import { useFirebaseSession } from "@/hooks/useFirebaseSession"
   import { useRouter } from "next/navigation"
   import { RestaurantService } from "@/services/restaurant/restaurantService"
   import toast from "react-hot-toast"
   import type { Restaurant } from "@/types/restaurant"
   
   interface UseRestaurantCardProps {
     restaurant: Restaurant
     initialSavedStatus?: boolean | null
     onWishlistChange?: (restaurant: Restaurant, isSaved: boolean) => void
     onClick?: () => void
   }
   
   export function useRestaurantCard({
     restaurant,
     initialSavedStatus,
     onWishlistChange,
     onClick,
   }: UseRestaurantCardProps) {
     const { user, firebaseUser } = useFirebaseSession()
     const router = useRouter()
     const [saved, setSaved] = useState<boolean | null>(initialSavedStatus ?? null)
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState<string | null>(null)
     const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
   
     useEffect(() => {
       setSaved(initialSavedStatus ?? false)
     }, [initialSavedStatus])
   
     const handleToggle = useCallback(async (e: React.MouseEvent) => {
       e.stopPropagation()
       // Business logic here
     }, [user, firebaseUser, restaurant, saved, onWishlistChange])
   
     const handleClick = useCallback(() => {
       if (onClick) {
         onClick()
       } else {
         router.push(`/restaurants/${restaurant.slug}`)
       }
     }, [router, restaurant.slug, onClick])
   
     return {
       saved,
       loading,
       error,
       handleToggle,
       handleClick,
       isReviewModalOpen,
       setIsReviewModalOpen,
     }
   }
   ```

**Validation:**
- [ ] Component uses new UI components
- [ ] Business logic extracted to hook
- [ ] Component uses CVA variants
- [ ] Component has `data-slot` attributes
- [ ] TypeScript types are correct
- [ ] Component is accessible
- [ ] No functionality broken
- [ ] Performance is maintained or improved

**Security Considerations:**
- ✅ Validate restaurant data before rendering
- ✅ Sanitize user-generated content
- ✅ Prevent XSS in dynamic content
- ✅ Secure API calls in hooks

**Performance Considerations:**
- ✅ Use `React.memo` if component re-renders frequently
- ✅ Memoize expensive computations in hook
- ✅ Lazy load modal components
- ✅ Optimize image loading

---

### 2.2 Implement Page-Specific Component Organization

**Priority:** P2 (Medium)

**Tasks:**

1. **Create `_components/` folders for pages**
   ```
   src/app/restaurants/
   ├── _components/
   │   ├── restaurant-list.tsx
   │   ├── restaurant-filters.tsx
   │   └── restaurant-grid.tsx
   └── page.tsx
   ```

2. **Move page-specific components**
   - Identify components used only by one page
   - Move to `_components/` folder
   - Update imports

**Validation:**
- [ ] Page-specific components in `_components/` folders
- [ ] Reusable components remain in `components/`
- [ ] Imports updated correctly
- [ ] No broken references

---

### 2.3 Standardize Export Patterns

**Priority:** P2 (Medium)

**Tasks:**

1. **Convert default exports to named exports**
   - Find all default exports in components
   - Convert to named exports
   - Update all imports

2. **Create export index files**
   ```typescript
   // src/components/ui/index.ts
   export { Button, buttonVariants } from "./button"
   export { Card, CardHeader, CardContent, CardFooter, cardVariants } from "./card"
   export { Input } from "./input"
   ```

**Validation:**
- [ ] All components use named exports
- [ ] Only pages use default exports
- [ ] Export index files created
- [ ] All imports updated

---

## Phase 3: Styling System Migration (Week 4-5)

### 3.1 Audit SCSS Files

**Priority:** P2 (Medium)

**Tasks:**

1. **List all SCSS files**
   ```bash
   find src/styles -name "*.scss" -type f
   ```

2. **Categorize SCSS files**
   - **Critical:** Components used on every page (navbar, footer)
   - **High:** Feature components (restaurant-card, review-card)
   - **Medium:** Page-specific styles
   - **Low:** Utility styles that can be replaced with Tailwind

3. **Document migration priority**
   - Create migration checklist
   - Estimate effort per file

**Validation:**
- [ ] All SCSS files documented
- [ ] Migration priority assigned
- [ ] Dependencies mapped

---

### 3.2 Migrate High-Priority SCSS to Tailwind

**Priority:** P2 (Medium)

**Migration Process:**

1. **For each SCSS file:**
   ```typescript
   // Before: src/styles/components/_restaurant-card.scss
   .restaurant-card {
     padding: 1rem;
     border-radius: 0.5rem;
     background: #FCFCFC;
     
     &:hover {
       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
     }
   }
   
   // After: Use Tailwind classes
   className="p-4 rounded-lg bg-background hover:shadow-md"
   ```

2. **Create design token mappings**
   ```typescript
   // Map SCSS variables to Tailwind tokens
   const tokenMap = {
     '$primary-color': 'bg-primary',
     '$secondary-color': 'bg-secondary',
     // ...
   }
   ```

3. **Update components to use Tailwind**
   - Remove SCSS imports
   - Replace with Tailwind classes
   - Use design tokens from `globals.css`

**Validation:**
- [ ] SCSS file removed
- [ ] Component uses Tailwind classes
- [ ] Visual appearance matches
- [ ] Responsive behavior maintained
- [ ] Dark mode works correctly

**Security Considerations:**
- ✅ Validate CSS class names to prevent injection
- ✅ Use Tailwind's safelist for dynamic classes

**Performance Considerations:**
- ✅ Remove unused SCSS from bundle
- ✅ Use Tailwind's purge to remove unused classes
- ✅ Minimize CSS bundle size

---

### 3.3 Implement Design Token System

**Priority:** P1 (High)

**Tasks:**

1. **Audit `globals.css` for design tokens**
   - Ensure all colors use CSS variables
   - Add missing tokens
   - Document token usage

2. **Create token reference document**
   ```typescript
   // src/config/design-tokens.ts
   export const designTokens = {
     colors: {
       background: 'var(--background)',
       foreground: 'var(--foreground)',
       primary: 'var(--primary)',
       // ...
     },
     spacing: {
       xs: '0.25rem',
       sm: '0.5rem',
       md: '1rem',
       // ...
     },
   }
   ```

3. **Replace hardcoded values**
   - Find all hardcoded colors
   - Replace with design tokens
   - Update components

**Validation:**
- [ ] All colors use design tokens
- [ ] No hardcoded color values
- [ ] Dark mode works correctly
- [ ] Token reference document created

---

## Phase 4: Type System & Organization (Week 6)

### 4.1 Complete Type Migration

**Priority:** P1 (High)

**Tasks:**

1. **Migrate all inline types**
   - Scan all components for inline type definitions
   - Move to appropriate type files
   - Update imports

2. **Create utility types**
   ```typescript
   // src/types/utils.ts
   export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
   export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
   ```

3. **Implement branded types for security**
   ```typescript
   // src/types/branded.ts
   export type UserId = string & { readonly __brand: unique symbol }
   export type RestaurantId = string & { readonly __brand: unique symbol }
   
   export function toUserId(id: string): UserId {
     // Validate UUID format
     if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
       throw new Error('Invalid UserId format')
     }
     return id as UserId
   }
   ```

**Validation:**
- [ ] All types centralized
- [ ] No duplicate definitions
- [ ] Utility types created
- [ ] Branded types for sensitive data

**Security Considerations:**
- ✅ Use branded types for user IDs, tokens, etc.
- ✅ Validate types at runtime boundaries
- ✅ Prevent type confusion attacks

---

### 4.2 Standardize Import Organization

**Priority:** P2 (Medium)

**Tasks:**

1. **Create import organization rule**
   ```typescript
   // 1. React and Next.js
   import * as React from "react"
   import { useRouter } from "next/navigation"
   
   // 2. Third-party libraries
   import { toast } from "react-hot-toast"
   import { cva } from "class-variance-authority"
   
   // 3. Internal utilities and types
   import { cn } from "@/lib/utils"
   import type { Restaurant } from "@/types/restaurant"
   
   // 4. Components
   import { Button } from "@/components/ui/button"
   import { Card } from "@/components/ui/card"
   
   // 5. Styles (if needed)
   import "@/styles/components/_restaurant-card.scss"
   ```

2. **Create ESLint rule for import ordering**
   ```json
   // .eslintrc.json
   {
     "rules": {
       "import/order": [
         "error",
         {
           "groups": [
             ["builtin", "external"],
             "internal",
             ["parent", "sibling"],
             "index"
           ],
           "newlines-between": "always"
         }
       ]
     }
   }
   ```

3. **Apply to all files**
   - Use automated tool (ESLint --fix)
   - Manual review for edge cases

**Validation:**
- [ ] Import order consistent across codebase
- [ ] ESLint rule configured
- [ ] All files updated

---

## Phase 5: Performance Optimization (Week 7)

### 5.1 Component Performance

**Priority:** P0 (Critical)

**Tasks:**

1. **Implement React.memo for expensive components**
   ```typescript
   export const RestaurantCard = React.memo(function RestaurantCard({
     restaurant,
     ...props
   }: RestaurantCardProps) {
     // Component implementation
   }, (prevProps, nextProps) => {
     // Custom comparison function
     return prevProps.restaurant.id === nextProps.restaurant.id
   })
   ```

2. **Optimize re-renders**
   - Use `useCallback` for event handlers
   - Use `useMemo` for expensive computations
   - Split components to minimize re-render scope

3. **Lazy load heavy components**
   ```typescript
   const RestaurantModal = React.lazy(() => import("./RestaurantModal"))
   
   // Usage
   <Suspense fallback={<LoadingSpinner />}>
     <RestaurantModal />
   </Suspense>
   ```

4. **Optimize images**
   - Use Next.js Image component
   - Implement proper sizing
   - Use blur placeholders
   - Lazy load below-fold images

**Validation:**
- [ ] Expensive components memoized
   - [ ] Re-render count reduced
   - [ ] Performance metrics improved
- [ ] Heavy components lazy loaded
- [ ] Images optimized
- [ ] Bundle size reduced

**Performance Metrics:**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Bundle Size: < 200KB (gzipped)

---

### 5.2 Code Splitting

**Priority:** P1 (High)

**Tasks:**

1. **Implement route-based code splitting**
   - Next.js handles this automatically
   - Verify it's working correctly

2. **Implement component-based code splitting**
   ```typescript
   // Lazy load modals, heavy components
   const ReviewModal = React.lazy(() => import("@/components/review/ReviewModal"))
   ```

3. **Optimize bundle size**
   - Analyze bundle with `@next/bundle-analyzer`
   - Remove unused dependencies
   - Tree-shake unused code

**Validation:**
- [ ] Bundle size reduced
- [ ] Code splitting working
- [ ] No unnecessary code in bundles

---

### 5.3 API Performance

**Priority:** P0 (Critical)

**Tasks:**

1. **Implement request caching**
   ```typescript
   // Use React Query or SWR for caching
   import { useQuery } from "@tanstack/react-query"
   
   export function useRestaurant(slug: string) {
     return useQuery({
       queryKey: ["restaurant", slug],
       queryFn: () => fetchRestaurant(slug),
       staleTime: 5 * 60 * 1000, // 5 minutes
     })
   }
   ```

2. **Optimize API responses**
   - Implement pagination
   - Use field selection in GraphQL
   - Compress responses

3. **Implement request deduplication**
   - Prevent duplicate API calls
   - Use request queuing

**Validation:**
- [ ] API calls cached appropriately
- [ ] Response times improved
- [ ] Duplicate requests prevented

---

## Phase 6: Security Hardening (Week 8)

### 6.1 Input Validation & Sanitization

**Priority:** P0 (Critical)

**Tasks:**

1. **Implement input validation**
   ```typescript
   // src/lib/validation.ts
   import { z } from "zod"
   
   export const restaurantSlugSchema = z.string()
     .min(1)
     .max(100)
     .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
   
   export function validateRestaurantSlug(slug: unknown): string {
     return restaurantSlugSchema.parse(slug)
   }
   ```

2. **Sanitize user inputs**
   ```typescript
   // src/lib/sanitize.ts
   import DOMPurify from "isomorphic-dompurify"
   
   export function sanitizeHtml(html: string): string {
     return DOMPurify.sanitize(html, {
       ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
       ALLOWED_ATTR: ['href'],
     })
   }
   ```

3. **Validate at API boundaries**
   - Validate all API inputs
   - Validate all user-generated content
   - Reject invalid data early

**Validation:**
- [ ] All inputs validated
- [ ] XSS prevention in place
- [ ] SQL injection prevention (if applicable)
- [ ] CSRF protection enabled

---

### 6.2 Authentication & Authorization

**Priority:** P0 (Critical)

**Tasks:**

1. **Audit authentication flow**
   - Verify Firebase token validation
   - Check token expiration handling
   - Validate user permissions

2. **Implement authorization checks**
   ```typescript
   // src/lib/auth.ts
   export async function requireAuth(): Promise<User> {
     const { user, firebaseUser } = useFirebaseSession()
     if (!user || !firebaseUser) {
       throw new Error("Unauthorized")
     }
     return user
   }
   
   export async function requireRole(role: string): Promise<User> {
     const user = await requireAuth()
     if (user.role !== role) {
       throw new Error("Forbidden")
     }
     return user
   }
   ```

3. **Secure API routes**
   - Validate tokens on all protected routes
   - Check permissions before operations
   - Log security events

**Validation:**
- [ ] All protected routes require authentication
- [ ] Authorization checks in place
- [ ] Token validation working
- [ ] Security logging enabled

---

### 6.3 Data Protection

**Priority:** P0 (Critical)

**Tasks:**

1. **Sanitize sensitive data**
   - Never log passwords, tokens
   - Mask sensitive data in responses
   - Use environment variables for secrets

2. **Implement rate limiting**
   ```typescript
   // src/middleware/rate-limit.ts
   import { Ratelimit } from "@upstash/ratelimit"
   import { Redis } from "@upstash/redis"
   
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, "10 s"),
   })
   ```

3. **Validate data at boundaries**
   - API request validation
   - Database query validation
   - Response sanitization

**Validation:**
- [ ] Sensitive data protected
- [ ] Rate limiting implemented
- [ ] Data validation at all boundaries

---

## Validation & Testing

### Component Testing

**Tasks:**

1. **Visual regression testing**
   - Compare before/after screenshots
   - Test on multiple screen sizes
   - Test dark mode

2. **Functionality testing**
   - Test all user interactions
   - Test error states
   - Test loading states

3. **Performance testing**
   - Measure render times
   - Check bundle sizes
   - Test on slow networks

### Security Testing

**Tasks:**

1. **Penetration testing**
   - Test for XSS vulnerabilities
   - Test for CSRF vulnerabilities
   - Test authentication bypass

2. **Dependency scanning**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Code review**
   - Review all security-sensitive code
   - Check for hardcoded secrets
   - Verify input validation

---

## Rollback Procedures

### If Migration Fails

1. **Immediate rollback**
   - Revert to previous git commit
   - Restore database backup (if needed)
   - Notify team

2. **Partial rollback**
   - Revert specific phase
   - Keep successful phases
   - Document issues

3. **Post-mortem**
   - Document what went wrong
   - Update migration plan
   - Retry with fixes

---

## Success Criteria

### Phase Completion Criteria

**Phase 1: Foundation**
- [ ] Base UI components created and working
- [ ] Types centralized
- [ ] No breaking changes

**Phase 2: Component Architecture**
- [ ] Reference component migrated
- [ ] Patterns documented
- [ ] Team trained

**Phase 3: Styling**
- [ ] 80% of SCSS migrated
- [ ] Design tokens in use
- [ ] Visual consistency maintained

**Phase 4: Types & Organization**
- [ ] All types centralized
- [ ] Imports standardized
- [ ] Code quality improved

**Phase 5: Performance**
- [ ] Bundle size reduced by 20%
- [ ] LCP improved by 30%
- [ ] API response times improved

**Phase 6: Security**
- [ ] All inputs validated
- [ ] Authentication hardened
- [ ] No known vulnerabilities

### Overall Success Metrics

- ✅ **Performance:** LCP < 2.5s, Bundle < 200KB
- ✅ **Security:** Zero critical vulnerabilities
- ✅ **Maintainability:** Consistent patterns, documented
- ✅ **Developer Experience:** Faster development, fewer bugs
- ✅ **User Experience:** Faster load times, smoother interactions

---

## AI Execution Guidelines

### For AI Agents Executing This Migration

1. **Read this document completely** before starting
2. **Validate each step** before proceeding
3. **Test thoroughly** after each phase
4. **Document changes** as you go
5. **Ask for clarification** if requirements are unclear
6. **Roll back** if critical issues arise
7. **Update this document** with lessons learned

### Execution Checklist Template

For each phase:
- [ ] Read phase requirements
- [ ] Understand dependencies
- [ ] Execute tasks in order
- [ ] Validate each task
- [ ] Test functionality
- [ ] Check performance
- [ ] Verify security
- [ ] Document changes
- [ ] Commit with descriptive message
- [ ] Mark phase as complete

### Common Pitfalls to Avoid

1. ❌ **Don't skip validation steps**
2. ❌ **Don't break existing functionality**
3. ❌ **Don't ignore security considerations**
4. ❌ **Don't forget to test**
5. ❌ **Don't commit without review**

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team  
**Next Review:** After Phase 1 completion
