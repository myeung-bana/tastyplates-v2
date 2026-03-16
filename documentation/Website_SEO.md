# Website SEO Guide (TastyPlates)

This guide covers the SEO setup for TastyPlates, including metadata, structured data, sitemaps, and **Bing** (plus other search engines). All implementation is App Router–based using Next.js metadata and custom utilities.

---

## Overview

The implementation includes:

- Metadata (title, description, keywords, canonical URLs)
- Open Graph and Twitter Card support
- Structured data (Schema.org JSON-LD)
- Dynamic sitemap and robots.txt
- Bing Webmaster verification and Bing Clarity analytics
- Security and mobile-friendly metadata

---

## Files and Structure

| File | Purpose |
|------|--------|
| **`src/lib/seo.ts`** | `generateMetadata()`, `generateStructuredData()`, `siteConfig` |
| **`src/components/seo/StructuredData.tsx`** | Injects JSON-LD structured data |
| **`src/app/sitemap.ts`** | Dynamic sitemap (e.g. `/sitemap.xml`) |
| **`src/app/robots.ts`** | Robots.txt configuration |
| **`src/app/restaurants/[slug]/metadata.ts`** | Restaurant page metadata |
| **`src/app/restaurants/[slug]/RestaurantStructuredData.tsx`** | Restaurant-specific structured data |

---

## Environment Variables

Add to `.env.local`:

```env
# Site URL (required)
NEXT_PUBLIC_SITE_URL=https://www.tastyplates.co

# Bing Webmaster Tools verification (optional)
NEXT_PUBLIC_BING_VERIFICATION_CODE=your_bing_verification_code_here

# Bing Clarity analytics (optional)
NEXT_PUBLIC_BING_CLARITY_ID=your_clarity_project_id_here
```

---

## Setup Steps

### 1. Site URL and brand

In `src/lib/seo.ts` set your site URL and brand:

```typescript
export const siteConfig = {
  name: "TastyPlates",
  description: "Your description here",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.tastyplates.co",
  ogImage: "/images/tastyplates_og_image.png",  // 1200x630px recommended
  twitterHandle: "@your_twitter_handle",
  // ...
};
```

### 2. Open Graph image

Place your default OG image at `/public/images/tastyplates_og_image.png` (or update `ogImage` in `siteConfig`).

### 3. Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add your site and get the verification code.
3. Set `NEXT_PUBLIC_BING_VERIFICATION_CODE` in `.env.local`.  
   The app uses this to render the `msvalidate.01` meta tag for verification.

### 4. Bing Clarity (optional)

1. Create a project at [Microsoft Clarity](https://clarity.microsoft.com).
2. Copy the project ID and set `NEXT_PUBLIC_BING_CLARITY_ID` in `.env.local`.  
   The app injects the Clarity script when this is set (e.g. in layout or a dedicated component).

### 5. Sitemap

The sitemap is generated at `/sitemap.xml` from `src/app/sitemap.ts`. To include dynamic restaurant URLs, fetch restaurants and add entries, for example:

```typescript
// In src/app/sitemap.ts
const restaurants = await fetchAllRestaurants();
restaurants.forEach((restaurant) => {
  routes.push({
    url: `${baseUrl}/restaurants/${restaurant.slug}`,
    lastModified: restaurant.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  });
});
```

Submit your sitemap in **Bing Webmaster Tools** (Sitemaps) and **Google Search Console**.

---

## Usage

### Page metadata (server components)

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

### Structured data

```typescript
import StructuredData from "@/components/seo/StructuredData";

<StructuredData
  type="Article"
  data={{
    title: "Article Title",
    description: "Article description",
    // ... other Schema.org fields
  }}
/>
```

---

## Bing and Search Engine Checklist

- **Verification:** `NEXT_PUBLIC_BING_VERIFICATION_CODE` → `msvalidate.01` meta tag (no separate XML file needed if using meta).
- **Sitemap:** Submit `https://yourdomain.com/sitemap.xml` in Bing Webmaster Tools and Google Search Console.
- **Robots:** Confirm `https://yourdomain.com/robots.txt` allows crawling where intended.
- **Clarity:** Optional; set `NEXT_PUBLIC_BING_CLARITY_ID` to enable session replay and heatmaps for Bing/Clarity.

---

## Testing

| Check | Tool / Action |
|-------|----------------|
| **Structured data** | [Google Rich Results Test](https://search.google.com/test/rich-results), [Bing Markup Validator](https://www.bing.com/webmasters/markup-validator) |
| **Meta tags** | View page source, inspect `<head>`, or use [Open Graph Debugger](https://www.opengraph.xyz/) |
| **Sitemap** | Open `https://yourdomain.com/sitemap.xml` and submit to Bing + Google |
| **Robots** | Open `https://yourdomain.com/robots.txt` and verify rules |

---

## Performance and Core Web Vitals

Bing (and Google) use page experience signals:

- Prefer **Next.js Image** for images (built-in optimization).
- Monitor **Core Web Vitals** (LCP, FID, CLS) via Next.js Analytics or tools like [PageSpeed Insights](https://pagespeed.web.dev/).
- Optional: use `@next/bundle-analyzer` to keep JS bundles small and improve load time.

---

## Implemented Features

- Metadata (title, description, keywords, canonical)
- Open Graph and Twitter Cards
- Schema.org JSON-LD (including restaurant-specific)
- Dynamic sitemap and robots.txt
- Bing verification meta tag
- Bing Clarity integration (when env is set)
- Security-related headers (e.g. X-Frame-Options) where configured
- Mobile-friendly metadata

---

## Next Steps

1. **Structured data:** Add BreadcrumbList, Review/Rating, or richer LocalBusiness where relevant.
2. **Sitemap:** Ensure all important dynamic routes (restaurants, key pages) are in `sitemap.ts`.
3. **Analytics:** Use Bing Webmaster Tools and Clarity to monitor impressions, clicks, and behavior.
4. **Performance:** Optimize OG images and monitor Core Web Vitals.

---

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org](https://schema.org/)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [Open Graph Protocol](https://ogp.me/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Microsoft Clarity](https://clarity.microsoft.com)
