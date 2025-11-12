# SEO Setup Guide for TastyPlates

This document outlines the SEO implementation for TastyPlates, optimized for Bing and other search engines.

## Overview

The SEO implementation includes:
- Comprehensive metadata generation
- Structured data (Schema.org JSON-LD)
- Sitemap generation
- Robots.txt configuration
- Bing-specific optimizations
- Open Graph and Twitter Card support

## Files Created

### Core SEO Files

1. **`src/lib/seo.ts`** - Main SEO utility functions
   - `generateMetadata()` - Generates comprehensive metadata
   - `generateStructuredData()` - Creates JSON-LD structured data
   - `siteConfig` - Site configuration

2. **`src/components/seo/StructuredData.tsx`** - Component for injecting structured data

3. **`src/app/sitemap.ts`** - Dynamic sitemap generation

4. **`src/app/robots.ts`** - Robots.txt configuration

5. **`src/app/restaurants/[slug]/metadata.ts`** - Restaurant page metadata generator

6. **`src/app/restaurants/[slug]/RestaurantStructuredData.tsx`** - Restaurant structured data component

## Environment Variables

Add these to your `.env.local` file:

```env
# Site URL (required)
NEXT_PUBLIC_SITE_URL=https://www.tastyplates.co

# Bing Webmaster Tools Verification Code (optional)
NEXT_PUBLIC_BING_VERIFICATION_CODE=your_bing_verification_code_here

# Bing Clarity Analytics Project ID (optional)
NEXT_PUBLIC_BING_CLARITY_ID=your_clarity_project_id_here
```

## Setup Steps

### 1. Configure Site URL

Update `src/lib/seo.ts` with your actual site URL:

```typescript
export const siteConfig = {
  name: "TastyPlates",
  description: "Your description here",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.tastyplates.co",
  // ... rest of config
};
```

### 2. Add Open Graph Image

Create an Open Graph image at `/public/images/tastyplates_og_image.png` (1200x630px recommended).

Or update the path in `src/lib/seo.ts`:

```typescript
ogImage: "/images/your-og-image.png",
```

### 3. Update Twitter Handle

In `src/lib/seo.ts`, update your Twitter handle:

```typescript
twitterHandle: "@your_twitter_handle",
```

### 4. Bing Webmaster Tools Setup

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Get your verification code
4. Add it to `.env.local` as `NEXT_PUBLIC_BING_VERIFICATION_CODE`

### 5. Bing Clarity Analytics (Optional)

1. Go to [Microsoft Clarity](https://clarity.microsoft.com)
2. Create a project
3. Get your project ID
4. Add it to `.env.local` as `NEXT_PUBLIC_BING_CLARITY_ID`

### 6. Update Sitemap

The sitemap is automatically generated at `/sitemap.xml`. To include dynamic restaurant pages:

1. Update `src/app/sitemap.ts`
2. Fetch restaurants from your API
3. Add them to the sitemap array

Example:

```typescript
// In sitemap.ts
const restaurants = await fetchAllRestaurants();
restaurants.forEach(restaurant => {
  routes.push({
    url: `${baseUrl}/restaurants/${restaurant.slug}`,
    lastModified: restaurant.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  });
});
```

## Usage

### Adding Metadata to a Page

For server components:

```typescript
import { generateMetadata as generateSEOMetadata, siteConfig } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEOMetadata({
  title: "Page Title",
  description: "Page description",
  canonical: `${siteConfig.url}/your-page`,
  type: "website",
});
```

### Adding Structured Data

```typescript
import StructuredData from "@/components/seo/StructuredData";

// In your component
<StructuredData 
  type="Article" 
  data={{
    title: "Article Title",
    description: "Article description",
    // ... other data
  }} 
/>
```

## Testing

### 1. Validate Structured Data

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Bing Markup Validator](https://www.bing.com/webmasters/markup-validator)

### 2. Check Metadata

- View page source and check `<head>` section
- Use browser dev tools to inspect meta tags
- Test with [Open Graph Debugger](https://www.opengraph.xyz/)

### 3. Verify Sitemap

- Visit `https://yourdomain.com/sitemap.xml`
- Submit to Bing Webmaster Tools
- Submit to Google Search Console

### 4. Check Robots.txt

- Visit `https://yourdomain.com/robots.txt`
- Verify it's correctly configured

## Features Implemented

✅ Comprehensive metadata (title, description, keywords)
✅ Open Graph tags for social sharing
✅ Twitter Card support
✅ Canonical URLs
✅ Structured data (Schema.org JSON-LD)
✅ Restaurant-specific structured data
✅ Sitemap generation
✅ Robots.txt configuration
✅ Bing verification meta tag
✅ Bing Clarity analytics integration
✅ Security headers (X-Frame-Options, etc.)
✅ Mobile-friendly metadata

## Next Steps

1. **Add more structured data types**:
   - BreadcrumbList for navigation
   - Review/Rating schema
   - LocalBusiness schema enhancements

2. **Enhance sitemap**:
   - Add dynamic restaurant pages
   - Add review pages if public
   - Add category/tag pages

3. **Performance optimization**:
   - Optimize images for Open Graph
   - Implement lazy loading for structured data
   - Monitor Core Web Vitals

4. **Analytics**:
   - Set up Bing Webmaster Tools
   - Configure Bing Clarity
   - Monitor search performance

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org Documentation](https://schema.org/)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [Open Graph Protocol](https://ogp.me/)

