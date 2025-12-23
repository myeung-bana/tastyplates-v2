# TastyStudio Design Rules & Coding Patterns

This document outlines the design rules, coding patterns, and best practices specifically for TastyStudio pages (`/tastystudio/*`). TastyStudio is the user content creation hub, inspired by TikTok Studio's layout and functionality.

---

## Table of Contents

1. [Overview](#overview)
2. [Layout Structure](#layout-structure)
3. [Design Principles](#design-principles)
4. [Component Patterns](#component-patterns)
5. [Styling Guidelines](#styling-guidelines)
6. [Navigation Patterns](#navigation-patterns)
7. [Responsive Design](#responsive-design)
8. [Code Organization](#code-organization)
9. [Best Practices](#best-practices)

---

## Overview

TastyStudio (`/tastystudio/*`) is a dedicated section for user content creation. All pages under this route share a consistent layout with:

- **Top Navbar**: Global navigation (inherited from root layout)
- **Left Sidebar**: Desktop-only navigation sidebar (256px width)
- **Main Content Area**: Full-width content area offset by sidebar on desktop

### Route Structure

```
/tastystudio/
  ├── dashboard/          # Overview & stats
  ├── add-review/         # Upload a Review
  │   └── [slug]/         # Review with restaurant slug
  └── review-listing/     # Edit Reviews
```

---

## Layout Structure

### Parent Layout (`/tastystudio/layout.tsx`)

All TastyStudio pages are wrapped in a parent layout that provides:

1. **Top Navbar**: Global navigation
2. **Left Sidebar**: Desktop-only navigation (`TastyStudioSidebar` component)
3. **Main Content Area**: Flex container with proper spacing

**Key Rules:**
- Sidebar is **desktop-only** (`hidden lg:flex`)
- Sidebar is **fixed position** with `top-16` (below navbar)
- Main content has `ml-64` margin on desktop to account for sidebar
- Background color: `bg-gray-50`

**Example Structure:**
```tsx
<section className="min-h-screen bg-gray-50">
  <Navbar />
  <div className="flex pt-16">
    <TastyStudioSidebar /> {/* Desktop only */}
    <main className="flex-1 lg:ml-64">
      {children}
    </main>
  </div>
</section>
```

### Child Layouts

**DO NOT** include Navbar in child layouts (`/tastystudio/*/layout.tsx`). The parent layout already provides it.

**Correct:**
```tsx
// /tastystudio/add-review/layout.tsx
export default function AddReviewLayout({ children }) {
  return <>{children}</>;
}
```

**Incorrect:**
```tsx
// ❌ Don't duplicate Navbar
export default function AddReviewLayout({ children }) {
  return (
    <section>
      <Navbar /> {/* ❌ Already in parent */}
      {children}
    </section>
  );
}
```

---

## Design Principles

### 1. Consistency
- All TastyStudio pages must follow the same layout structure
- Use consistent spacing, typography, and color schemes
- Maintain visual hierarchy with clear sections

### 2. Content-First
- Main content area is the focus
- Sidebar provides navigation, not primary content
- Keep sidebar minimal and unobtrusive

### 3. Desktop-First, Mobile-Responsive
- Sidebar is desktop-only (hidden on mobile)
- Mobile navigation should use alternative patterns (e.g., bottom nav, top menu)
- Content adapts gracefully to smaller screens

### 4. Brand Alignment
- Use primary color `#ff7c0a` for active states
- Use `font-neusans` for all text
- Maintain consistency with rest of application

---

## Component Patterns

### TastyStudioSidebar Component

**Location:** `src/components/tastystudio/TastyStudioSidebar.tsx`

**Structure:**
- Fixed position sidebar (256px width)
- Header section with title and subtitle
- Navigation items with icons and descriptions
- Footer section with additional links

**Navigation Items:**
- Dashboard (`/tastystudio/dashboard`)
- Upload a Review (`/tastystudio/add-review`)
- Edit Reviews (`/tastystudio/review-listing`)

**Active State:**
- Background: `bg-[#ff7c0a]`
- Text: `text-white`
- Icon: `text-white`

**Inactive State:**
- Background: Transparent (hover: `bg-gray-50`)
- Text: `text-[#494D5D]`
- Icon: `text-[#494D5D]` (hover: `text-[#ff7c0a]`)

**Example:**
```tsx
<Link
  href={item.href}
  className={`
    group flex items-start gap-3 px-4 py-3 rounded-xl
    ${active 
      ? 'bg-[#ff7c0a] text-white shadow-sm' 
      : 'text-[#494D5D] hover:bg-gray-50'
    }
  `}
>
  <Icon className={active ? 'text-white' : 'text-[#494D5D]'} />
  <div>
    <div className="font-medium text-sm font-neusans">{item.label}</div>
    <div className="text-xs text-gray-500 font-neusans">{item.description}</div>
  </div>
</Link>
```

---

## Styling Guidelines

### Colors

**Primary Color:**
- Active states: `#ff7c0a` (`bg-[#ff7c0a]`, `text-[#ff7c0a]`)
- Hover states: `bg-[#ff7c0a]/10` or `text-[#ff7c0a]`

**Text Colors:**
- Primary text: `text-[#31343F]`
- Secondary text: `text-[#494D5D]`
- Muted text: `text-gray-500` or `text-gray-600`
- White text: `text-white` (on active backgrounds)

**Background Colors:**
- Page background: `bg-gray-50`
- Card/Container: `bg-white`
- Hover states: `bg-gray-50` or `bg-gray-100`

### Typography

**Font Family:**
- Always use `font-neusans` for all text in TastyStudio pages
- No exceptions - maintain brand consistency

**Font Sizes:**
- Page titles: `text-3xl md:text-4xl`
- Section headers: `text-xl md:text-2xl`
- Body text: `text-base` or `text-sm`
- Descriptions: `text-xs` or `text-sm`

**Font Weights:**
- Headers: `font-bold` or `font-semibold`
- Body: `font-normal` or `font-medium`
- Labels: `font-medium`

### Spacing

**Container Padding:**
- Page container: `px-4 py-8 md:py-12`
- Section spacing: `mb-8 md:mb-12`
- Card padding: `p-6 md:p-8`

**Sidebar Spacing:**
- Header: `px-6 py-5`
- Nav items: `px-4 py-3`
- Footer: `px-6 py-4`

### Borders & Shadows

**Borders:**
- Sidebar: `border-r border-gray-200`
- Cards: `border border-gray-200`
- Dividers: `border-t border-gray-200`

**Shadows:**
- Cards: `shadow-sm`
- Active nav items: `shadow-sm`
- Modals: `shadow-lg` or `shadow-xl`

### Border Radius

- Cards/Containers: `rounded-xl` or `rounded-2xl`
- Buttons: `rounded-xl`
- Nav items: `rounded-xl`
- Inputs: `rounded-lg` or `rounded-xl`

---

## Navigation Patterns

### Active Route Detection

Use `usePathname()` to detect active routes:

```tsx
const pathname = usePathname();

const isActive = (href: string) => {
  if (href === TASTYSTUDIO_DASHBOARD) {
    return pathname === TASTYSTUDIO_DASHBOARD;
  }
  return pathname?.startsWith(href);
};
```

### Route Constants

Always use constants from `@/constants/pages`:

```tsx
import { 
  TASTYSTUDIO_DASHBOARD,
  TASTYSTUDIO_ADD_REVIEW,
  TASTYSTUDIO_REVIEW_LISTING 
} from '@/constants/pages';
```

### Navigation Links

- Use Next.js `Link` component for client-side navigation
- Include proper hover and active states
- Add icons from `react-icons/fi` (Feather Icons)
- Include descriptions for clarity

---

## Responsive Design

### Breakpoints

- Mobile: `< 1024px` (sidebar hidden)
- Desktop: `>= 1024px` (sidebar visible)

### Mobile Considerations

1. **Sidebar**: Hidden on mobile (`hidden lg:flex`)
2. **Navigation**: Use alternative navigation (e.g., bottom nav, top menu)
3. **Content**: Full width on mobile, offset on desktop
4. **Spacing**: Adjust padding/margins for smaller screens

### Responsive Classes

```tsx
// Sidebar visibility
className="hidden lg:flex"

// Content offset
className="flex-1 lg:ml-64"

// Responsive padding
className="px-4 py-8 md:py-12"

// Responsive text
className="text-lg md:text-2xl"
```

---

## Code Organization

### File Structure

```
src/
├── app/
│   └── tastystudio/
│       ├── layout.tsx              # Parent layout
│       ├── dashboard/
│       │   └── page.tsx
│       ├── add-review/
│       │   ├── layout.tsx           # Child layout (no Navbar)
│       │   ├── page.tsx
│       │   └── [slug]/
│       │       └── page.tsx
│       └── review-listing/
│           ├── layout.tsx           # Child layout (no Navbar)
│           └── page.tsx
└── components/
    └── tastystudio/
        └── TastyStudioSidebar.tsx
```

### Component Naming

- Use PascalCase for component names
- Prefix with `TastyStudio` for shared components
- Use descriptive names: `TastyStudioSidebar`, `TastyStudioDashboard`, etc.

### Import Patterns

```tsx
// External libraries
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiEdit3 } from 'react-icons/fi';

// Internal components
import Navbar from '@/components/layout/Navbar';
import TastyStudioSidebar from '@/components/tastystudio/TastyStudioSidebar';

// Constants
import { TASTYSTUDIO_DASHBOARD } from '@/constants/pages';

// Hooks
import { useAuth } from '@/contexts/AuthContext';
```

---

## Best Practices

### 1. Always Use Parent Layout

**DO:**
```tsx
// Child page automatically gets parent layout
export default function DashboardPage() {
  return <div>Content</div>;
}
```

**DON'T:**
```tsx
// ❌ Don't wrap in section with Navbar
export default function DashboardPage() {
  return (
    <section>
      <Navbar /> {/* ❌ Already in parent */}
      <div>Content</div>
    </section>
  );
}
```

### 2. Consistent Styling

- Always use `font-neusans` for text
- Use Tailwind classes, not inline styles
- Follow the color palette (`#ff7c0a`, `#31343F`, `#494D5D`)
- Use consistent spacing scale

### 3. Accessibility

- Include proper ARIA labels
- Use semantic HTML
- Ensure keyboard navigation works
- Maintain proper focus states

### 4. Performance

- Use Next.js `Link` for client-side navigation
- Lazy load heavy components
- Optimize images with `next/image`
- Minimize re-renders with proper React patterns

### 5. Error Handling

- Handle loading states
- Show error messages gracefully
- Provide fallback UI
- Use proper error boundaries

### 6. Type Safety

- Use TypeScript for all components
- Define proper interfaces/types
- Use type-safe route constants
- Avoid `any` types

---

## Quick Reference

### Common Patterns

**Page Structure:**
```tsx
export default function TastyStudioPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 font-neusans">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Content */}
      </div>
    </div>
  );
}
```

**Card Component:**
```tsx
<div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200">
  {/* Card content */}
</div>
```

**Button (Primary):**
```tsx
<button className="px-4 py-3 bg-[#ff7c0a] text-white rounded-xl hover:bg-[#ff7c0a]/90 transition-colors font-neusans">
  Button Text
</button>
```

**Navigation Item:**
```tsx
<Link
  href={href}
  className={`
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
    ${active ? 'bg-[#ff7c0a] text-white' : 'text-[#494D5D] hover:bg-gray-50'}
  `}
>
  <Icon className="w-5 h-5" />
  <span className="font-neusans">{label}</span>
</Link>
```

---

## Checklist for New TastyStudio Pages

When creating a new TastyStudio page, ensure:

- [ ] Page is under `/tastystudio/*` route
- [ ] Uses parent layout (no duplicate Navbar)
- [ ] Uses `font-neusans` for all text
- [ ] Follows color palette (`#ff7c0a`, `#31343F`, `#494D5D`)
- [ ] Responsive design (mobile + desktop)
- [ ] Proper spacing and padding
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Type-safe (TypeScript)
- [ ] Uses route constants from `@/constants/pages`
- [ ] Sidebar navigation item added if needed
- [ ] Consistent with existing TastyStudio pages

---

## Examples

See existing implementations:
- `/tastystudio/dashboard` - Dashboard page
- `/tastystudio/add-review` - Review upload page
- `/tastystudio/review-listing` - Review management page

---

**Last Updated:** [Current Date]
**Maintained By:** Development Team
