# Restaurant API Migration Guide

## Overview

This document outlines the gradual migration from WordPress GraphQL API to Hasura-based REST API for restaurant data. The migration uses a feature flag system to allow safe, gradual rollout.

## Migration Status

**Current Phase**: Phase 1 - Infrastructure Setup ✅

## Architecture

### New API Endpoints

1. **`GET /api/v1/restaurants-v2/get-restaurants`**
   - Fetches list of restaurants with pagination
   - Supports filtering by status and search
   - Returns Hasura `restaurant_listings` data

2. **`GET /api/v1/restaurants-v2/get-restaurant-by-id`**
   - Fetches single restaurant by UUID or slug
   - Supports both UUID and slug for backward compatibility
   - Returns Hasura `restaurant_listings` data

### Feature Flag

**Flag Name**: `USE_RESTAURANT_V2_API`

**Location**: `src/constants/featureFlags.ts`

**Environment Variable**: `NEXT_PUBLIC_USE_RESTAURANT_V2_API`

**Default**: `false` (uses WordPress GraphQL API)

## How to Enable

### Development

1. Add to `.env.local`:
   ```
   NEXT_PUBLIC_USE_RESTAURANT_V2_API=true
   ```

2. Restart your development server

### Production

1. Set environment variable in your hosting platform
2. Redeploy application
3. Monitor for any issues

## Migration Steps (Option A - Gradual)

### ✅ Step 1: Infrastructure Setup (COMPLETED)

- [x] Create GraphQL queries for Hasura
- [x] Create API endpoints
- [x] Create `restaurantV2Service`
- [x] Create data transformation utilities
- [x] Create feature flag system

### ✅ Step 2: Component Updates (COMPLETED)

- [x] Update `Restaurant.tsx` to support both APIs
- [x] Update `/restaurants/[slug]/page.tsx` to support both APIs
- [x] Update metadata generation to support both APIs

### ⏳ Step 3: Testing

- [ ] Test with feature flag disabled (existing behavior)
- [ ] Test with feature flag enabled (new API)
- [ ] Compare results between both APIs
- [ ] Test edge cases (empty results, errors, etc.)
- [ ] Test pagination
- [ ] Test filtering and search

### ⏳ Step 4: Gradual Rollout

1. Enable for internal testing
2. Enable for beta users (if applicable)
3. Enable for small percentage of users
4. Monitor metrics and errors
5. Gradually increase percentage
6. Enable for all users

### ⏳ Step 5: Validation

- [ ] Verify all features work correctly
- [ ] Performance comparison
- [ ] Error rate comparison
- [ ] User feedback

### ⏳ Step 6: Cleanup

- [ ] Remove feature flag
- [ ] Remove old WordPress GraphQL code
- [ ] Update documentation
- [ ] Archive old service files

## Data Transformation

The migration includes transformation utilities to map between Hasura format and component format:

- `transformRestaurantV2ToListing`: For detail pages
- `transformRestaurantV2ToRestaurant`: For list pages

## Fallback Mechanism

Both components include automatic fallback to the WordPress API if the Hasura API fails:

```typescript
try {
  // Try V2 API
  const response = await restaurantV2Service.getRestaurantBySlug(slug);
} catch (v2Error) {
  // Fallback to V1 API
  const data = await restaurantService.fetchRestaurantDetails(slug);
}
```

## Known Limitations

1. **searchPalateStats**: Not yet available in V2 API - will need separate query when review data is integrated
2. **Pagination**: Currently using offset-based pagination (can be enhanced to cursor-based)
3. **Filtering**: Some complex filters (cuisine, palates, price) are still client-side (can be moved to API)

## Testing Checklist

### List Page (`/restaurants`)

- [ ] Loads restaurants correctly
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work (cuisine, price, rating, badges)
- [ ] Location filtering works
- [ ] Sorting works
- [ ] Empty states display correctly
- [ ] Error handling works

### Detail Page (`/restaurants/[slug]`)

- [ ] Loads restaurant details correctly
- [ ] All fields display correctly
- [ ] Images load
- [ ] Reviews display (if applicable)
- [ ] Metadata generation works
- [ ] Error handling works
- [ ] 404 handling works

## Rollback Plan

If issues are discovered:

1. Set `NEXT_PUBLIC_USE_RESTAURANT_V2_API=false`
2. Redeploy
3. System automatically uses WordPress API
4. Investigate and fix issues
5. Re-enable when ready

## Performance Monitoring

Monitor these metrics:

- API response times
- Error rates
- Page load times
- User-reported issues

## Support

For issues or questions:
- Check logs for API errors
- Verify Hasura table exists and is tracked
- Verify GraphQL queries are correct
- Check feature flag is set correctly

## Next Steps

1. Test thoroughly with feature flag enabled
2. Monitor for any issues
3. Gradually enable for more users
4. Complete full migration when confident

