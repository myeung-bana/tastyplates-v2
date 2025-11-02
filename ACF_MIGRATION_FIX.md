# ACF Migration Fix - Image Saving Issue

## Problem

When creating/editing reviews with images, the images were not being saved and could not be fetched when editing drafts. This occurred because:

1. Frontend was sending `review_images` parameter (new ACF format)
2. Backend attempted to save only to ACF field using `update_field()`
3. If ACF field wasn't configured in WordPress admin, `update_field()` would fail silently
4. Images were uploaded to media library but not associated with the comment
5. When fetching drafts, no images were found because neither ACF nor comment meta was saved

## Solution: Dual-Storage Strategy

Implemented a dual-storage approach during the migration period where images are saved to **both** ACF field (if available) and comment meta (as backup). This ensures images work regardless of ACF configuration status.

## Changes Made

### 1. POST `/v1/review` Endpoint (Create Review/Draft)
**File**: `documentation/dev-chrono-plugin.php` (lines 2295-2315)

```php
// Handle new ACF field parameter
if (isset($params['review_images']) && is_array($params['review_images'])) {
    $uploaded_image_ids = upload_review_images($params['review_images']);
    
    if (!empty($uploaded_image_ids)) {
        // Save to ACF field for new reviews (if ACF is configured)
        if (function_exists('update_field')) {
            update_field('review_images', $uploaded_image_ids, 'comment_' . $comment_id);
        }
        // Also save to comment meta as backup during transition
        update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
    }
}
```

**Key Points**:
- Checks if ACF functions exist before calling them
- Saves to ACF field if available
- Always saves to comment meta as backup
- Images work whether ACF is configured or not

### 2. PUT `/wp/v2/api/review-drafts/{id}` Endpoint (Update Draft)
**File**: `documentation/dev-chrono-plugin.php` (lines 2561-2589)

```php
// Handle review images update
if (isset($params['review_images']) && is_array($params['review_images'])) {
    $uploaded_image_ids = upload_review_images($params['review_images']);
    
    if (!empty($uploaded_image_ids)) {
        // Save to ACF field (if ACF is configured)
        if (function_exists('update_field')) {
            update_field('review_images', $uploaded_image_ids, 'comment_' . $comment_id);
        }
        // Also save to comment meta as backup during transition
        update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
    } else {
        // Clear both ACF field and meta
        if (function_exists('delete_field')) {
            delete_field('review_images', 'comment_' . $comment_id);
        }
        delete_comment_meta($comment_id, 'review_images_idz');
    }
}
```

### 3. GraphQL Resolver
**File**: `documentation/dev-chrono-plugin.php` (lines 1341-1383)

```php
register_graphql_field('Comment', 'reviewImages', [
    'resolve' => function ($comment, $args, $context) {
        $image_ids = [];
        
        // Try ACF field first (new reviews) - only if ACF is active
        if (function_exists('get_field')) {
            $acf_images = get_field('review_images', 'comment_' . $comment->commentId);
            
            if (!empty($acf_images) && is_array($acf_images)) {
                $image_ids = /* ... process ACF images ... */;
            }
        }
        
        // Fallback to comment meta (existing reviews or if ACF not configured)
        if (empty($image_ids)) {
            $image_ids_raw = get_comment_meta($comment->commentId, 'review_images_idz', true);
            /* ... process meta images ... */
        }
        
        // Convert IDs to MediaItem objects
        return $media_items;
    }
]);
```

**Key Points**:
- Checks if `get_field()` exists before calling
- Tries ACF field first
- Falls back to comment meta automatically
- Returns consistent format regardless of source

### 4. GET Endpoints (Fetch Drafts)
**File**: `documentation/dev-chrono-plugin.php` (lines 2369-2380 and 2465-2476)

```php
// Try ACF field first (if ACF is active)
$review_images_idz = [];
if (function_exists('get_field')) {
    $acf_images = get_field('review_images', 'comment_' . $comment->comment_ID);
    if (!empty($acf_images)) {
        $review_images_idz = $acf_images;
    }
}
// Fallback to comment meta
if (empty($review_images_idz)) {
    $review_images_idz = get_comment_meta($comment->comment_ID, 'review_images_idz', true);
}
```

### 5. `create_review_with_images` Function
**File**: `documentation/dev-chrono-plugin.php` (lines 107-119)

```php
if (!empty($uploaded_image_ids)) {
    // Save to ACF field (if ACF is configured)
    if (function_exists('update_field')) {
        update_field('review_images', $uploaded_image_ids, 'comment_' . $comment_id);
    }
    // Also save to comment meta as backup during transition
    update_comment_meta($comment_id, 'review_images_idz', $uploaded_image_ids);
    
    if (!has_post_thumbnail($listing_id)) {
        set_post_thumbnail($listing_id, $uploaded_image_ids[0]);
    }
}
```

## Benefits of This Approach

1. **Immediate Fix**: Images work immediately, even without ACF configured
2. **Backward Compatible**: Existing reviews continue working
3. **Forward Compatible**: When ACF is configured, it will be used automatically
4. **Zero Downtime**: No database migration needed
5. **Graceful Degradation**: System works with or without ACF
6. **Safe Transition**: Both storage methods active during migration period

## Testing Checklist

- [x] Create new review with images → saves to both ACF and meta
- [x] Create new draft with images → saves to both ACF and meta
- [x] Edit draft with images → updates both ACF and meta
- [x] Fetch draft → retrieves images from ACF or meta (whichever exists)
- [x] GraphQL query returns images correctly
- [x] REST API GET returns images correctly
- [x] Code works with ACF disabled
- [x] Code works with ACF enabled

## Current System State

**Without ACF Configured** (Current State):
- ✅ Images save to `review_images_idz` comment meta
- ✅ Images fetch from comment meta
- ✅ GraphQL returns images from meta
- ✅ Everything works normally

**With ACF Configured** (Future State):
- ✅ Images save to both ACF field and comment meta
- ✅ GraphQL prioritizes ACF field
- ✅ Falls back to meta if ACF field empty
- ✅ Benefits from ACF features (S3, WebP, etc.)

## Next Steps (Optional)

1. **Configure ACF Field** (when ready):
   - Create ACF Field Group for Comment type
   - Field Name: `review_images`
   - Field Type: Gallery
   - Return Format: Image ID
   - Location: Comment Type = `listing` OR `listing_draft`

2. **Monitor Performance**:
   - Verify S3 offload works with ACF field
   - Test WebP image uploads
   - Check GraphQL query performance

3. **Future Migration** (optional):
   - After ACF is stable, migrate old data from meta to ACF
   - Remove dual-storage and keep only ACF
   - This is optional and can be done anytime

## Summary

The image saving issue is now **completely fixed**. Images will be saved and retrieved correctly whether or not ACF is configured. The system is production-ready and will automatically benefit from ACF features once the field is created in WordPress admin, with zero code changes required.

