# Restaurant Reviews Database Structure

## Executive Summary

This document outlines the database structure for restaurant reviews in the TastyPlates application, designed to support a modern social media-style review system similar to Instagram/Xiaohongshu. The structure supports:

- **Main Reviews**: Full reviews with ratings, images, hashtags, and rich content
- **Nested Comments/Replies**: Unlimited nesting depth for conversations
- **Engagement Features**: Likes, hashtags, mentions, and recognitions
- **Media Support**: Multiple images per review
- **Draft System**: Save reviews as drafts before publishing
- **Moderation**: Approval workflow and soft deletes
- **Scalability**: Optimized for high read/write performance

---

## Current WordPress Structure

### Overview
The current system uses WordPress comments (`wp_comments`) with custom fields:
- **Comment Type**: `listing` (for restaurant reviews)
- **Parent-Child Relationship**: `comment_parent` for replies
- **Custom Fields** (via ACF):
  - `reviewMainTitle`: Review title/headline
  - `reviewStars`: Rating (1-5 stars)
  - `reviewImages`: Array of image attachment IDs
  - `palates`: User's palate preferences
  - `hashtags`: Array of hashtags
  - `recognitions`: Special badges/awards
  - `commentLikes`: Like count
  - `userLiked`: Whether current user liked

### Key Features
- Reviews are WordPress comments with `comment_type = 'listing'`
- Replies use `comment_parent` to reference parent comment
- Approval status via `comment_approved` (0 = pending, 1 = approved)
- Rich content with images, hashtags, and engagement metrics

---

## Proposed Hasura Database Structure

### Core Tables

#### 1. `restaurant_reviews` - Main Reviews Table

```sql

CREATE TABLE restaurant_reviews (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  restaurant_uuid UUID NOT NULL REFERENCES restaurants(uuid) ON DELETE CASCADE, -- UUID to match restaurants table (consistent with other UUID foreign keys)
  author_id UUID NOT NULL REFERENCES restaurant_users(id) ON DELETE CASCADE,
  parent_review_id UUID REFERENCES restaurant_reviews(id) ON DELETE CASCADE, -- NULL for top-level reviews, UUID for replies
  
  -- Review Content
  title VARCHAR(500), -- Review headline/title (reviewMainTitle)
  content TEXT NOT NULL, -- Main review content
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5), -- 0.0 to 5.0 stars (allows half stars)
  
  -- Media & Metadata (all stored in main table for simplicity)
  images JSONB DEFAULT '[]'::jsonb, -- Array of image objects (see structure below)
  palates JSONB, -- User's palate preferences at time of review: ["Italian", "Japanese"]
  hashtags TEXT[] DEFAULT '{}', -- Array of hashtags: ['foodie', 'delicious'] (stored without #, lowercase)
  mentions JSONB DEFAULT '[]'::jsonb, -- Array of user mentions: [{"user_id": "uuid", "username": "johndoe", "start_pos": 45, "end_pos": 54}]
  recognitions TEXT[], -- Special badges/awards: ['verified', 'top_reviewer']
  
  -- Engagement Metrics (denormalized for performance)
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  replies_count INTEGER DEFAULT 0 CHECK (replies_count >= 0),
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  
  -- Status & Moderation
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'hidden')),
  is_pinned BOOLEAN DEFAULT FALSE, -- Pin important reviews to top
  is_featured BOOLEAN DEFAULT FALSE, -- Feature on homepage/restaurant page
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ, -- When review was published (approved)
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- Constraints
  CONSTRAINT restaurant_reviews_rating_check CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  CONSTRAINT restaurant_reviews_content_length CHECK (char_length(content) >= 10), -- Minimum 10 characters
  CONSTRAINT restaurant_reviews_title_length CHECK (title IS NULL OR char_length(title) <= 500)
);

-- Indexes for Performance
CREATE INDEX idx_restaurant_reviews_restaurant_uuid ON restaurant_reviews(restaurant_uuid) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_reviews_author_id ON restaurant_reviews(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_reviews_parent_id ON restaurant_reviews(parent_review_id) WHERE parent_review_id IS NOT NULL;
CREATE INDEX idx_restaurant_reviews_status ON restaurant_reviews(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurant_reviews_created_at ON restaurant_reviews(created_at DESC) WHERE deleted_at IS NULL AND status = 'approved';
CREATE INDEX idx_restaurant_reviews_rating ON restaurant_reviews(rating DESC) WHERE deleted_at IS NULL AND status = 'approved';
CREATE INDEX idx_restaurant_reviews_likes_count ON restaurant_reviews(likes_count DESC) WHERE deleted_at IS NULL AND status = 'approved';
CREATE INDEX idx_restaurant_reviews_published_at ON restaurant_reviews(published_at DESC) WHERE deleted_at IS NULL AND status = 'approved';
CREATE INDEX idx_restaurant_reviews_hashtags ON restaurant_reviews USING GIN(hashtags) WHERE deleted_at IS NULL; -- GIN index for array searches
CREATE INDEX idx_restaurant_reviews_palates ON restaurant_reviews USING GIN(palates) WHERE deleted_at IS NULL; -- GIN index for JSONB searches
CREATE INDEX idx_restaurant_reviews_images ON restaurant_reviews USING GIN(images) WHERE deleted_at IS NULL; -- GIN index for JSONB image array searches
CREATE INDEX idx_restaurant_reviews_mentions ON restaurant_reviews USING GIN(mentions) WHERE deleted_at IS NULL; -- GIN index for JSONB mention searches

-- Partial index for top-level reviews only (parent_review_id IS NULL)
CREATE INDEX idx_restaurant_reviews_top_level ON restaurant_reviews(restaurant_uuid, created_at DESC) 
  WHERE deleted_at IS NULL AND status = 'approved' AND parent_review_id IS NULL;

-- Partial index for replies only
CREATE INDEX idx_restaurant_reviews_replies ON restaurant_reviews(parent_review_id, created_at ASC) 
  WHERE deleted_at IS NULL AND status = 'approved' AND parent_review_id IS NOT NULL;
```

**Key Features:**
- **Self-referencing**: `parent_review_id` allows unlimited nesting depth for replies/comments
- **Denormalized Counts**: `likes_count`, `replies_count` for fast queries
- **Status Workflow**: `draft` → `pending` → `approved` → `published_at` set
- **Soft Deletes**: `deleted_at` preserves data while hiding from queries
- **Array/JSONB Fields**: `hashtags`, `images`, `mentions`, and `palates` use PostgreSQL arrays/JSONB for efficient querying
- **Simplified Structure**: Images, hashtags, and mentions stored in main table (no separate tables needed)

**Images JSONB Structure Example:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://cdn.tastyplates.co/reviews/abc123.jpg",
    "thumbnail_url": "https://cdn.tastyplates.co/reviews/thumb_abc123.jpg",
    "alt_text": "Delicious pasta dish",
    "width": 1920,
    "height": 1080,
    "display_order": 0,
    "file_size": 524288,
    "mime_type": "image/jpeg"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "url": "https://cdn.tastyplates.co/reviews/abc124.jpg",
    "thumbnail_url": "https://cdn.tastyplates.co/reviews/thumb_abc124.jpg",
    "alt_text": "Dessert platter",
    "width": 1920,
    "height": 1080,
    "display_order": 1,
    "file_size": 612345,
    "mime_type": "image/jpeg"
  }
]
```

**Mentions JSONB Structure Example:**
```json
[
  {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "start_pos": 45,
    "end_pos": 54
  },
  {
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "janedoe",
    "start_pos": 120,
    "end_pos": 128
  }
]
```

**Parent/Child Relationship:**
- **Top-level reviews**: `parent_review_id = NULL`
- **Direct replies**: `parent_review_id = <review_id>`
- **Nested replies**: `parent_review_id = <parent_reply_id>` (unlimited depth)
- Example structure:
  ```
  Review A (id: uuid-1, parent_review_id: NULL)
    └─ Reply B (id: uuid-2, parent_review_id: uuid-1)
        └─ Reply C (id: uuid-3, parent_review_id: uuid-2)
            └─ Reply D (id: uuid-4, parent_review_id: uuid-3)
    └─ Reply E (id: uuid-5, parent_review_id: uuid-1)
  ```

---

#### 2. `restaurant_review_likes` - Likes/Engagement Table

```sql
CREATE TABLE restaurant_review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES restaurant_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES restaurant_users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one like per user per review
  CONSTRAINT restaurant_review_likes_unique UNIQUE (review_id, user_id)
);

-- Indexes
CREATE INDEX idx_restaurant_review_likes_review_id ON restaurant_review_likes(review_id);
CREATE INDEX idx_restaurant_review_likes_user_id ON restaurant_review_likes(user_id);
CREATE INDEX idx_restaurant_review_likes_created_at ON restaurant_review_likes(created_at DESC);
```

**Note:** The `likes_count` in `restaurant_reviews` is automatically updated via triggers when likes are added/removed.

**Like/Unlike Mechanism:**
- **Like**: Insert a row into `restaurant_review_likes` → trigger increments `likes_count`
- **Unlike**: Delete the row from `restaurant_review_likes` → trigger decrements `likes_count`
- **Toggle**: Check if liked, then INSERT (like) or DELETE (unlike)
- **UNIQUE Constraint**: Prevents duplicate likes (same user can't like same review twice)
- **Works for both**: Top-level reviews and replies (both stored in `restaurant_reviews` table)

**Example Flow:**
```sql
-- 1. User likes a review
INSERT INTO restaurant_review_likes (review_id, user_id)
VALUES ('review-uuid-1', 'user-uuid-123');
-- Trigger automatically: review-uuid-1.likes_count = 1

-- 2. User unlikes the same review
DELETE FROM restaurant_review_likes
WHERE review_id = 'review-uuid-1' AND user_id = 'user-uuid-123';
-- Trigger automatically: review-uuid-1.likes_count = 0

-- 3. User can like again (toggle behavior)
INSERT INTO restaurant_review_likes (review_id, user_id)
VALUES ('review-uuid-1', 'user-uuid-123');
-- Trigger automatically: review-uuid-1.likes_count = 1
```

**Toggle Like/Unlike Pattern (PostgreSQL UPSERT):**
```sql
-- Like if not exists, unlike if exists (single query)
INSERT INTO restaurant_review_likes (review_id, user_id)
VALUES ($1, $2)
ON CONFLICT (review_id, user_id)  -- Uses UNIQUE constraint
DO DELETE;  -- If conflict (already liked), delete it (unlike)
```

---

### Optional: Advanced Analytics Tables

**Note:** The main `restaurant_reviews` table stores `hashtags` (as TEXT[]) and `mentions` (as JSONB) directly. Separate tables are only needed if you require advanced analytics features.

#### Optional: `restaurant_review_hashtags` - Hashtag Analytics Table

Only create this table if you need:
- Real-time hashtag trending analytics
- Dedicated hashtag pages with pagination
- Complex hashtag search/filtering
- Hashtag creation timestamps for analytics

```sql
CREATE TABLE restaurant_review_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag VARCHAR(100) NOT NULL, -- Normalized hashtag (lowercase, no #)
  review_id UUID NOT NULL REFERENCES restaurant_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT restaurant_review_hashtags_unique UNIQUE (hashtag, review_id)
);

CREATE INDEX idx_restaurant_review_hashtags_hashtag ON restaurant_review_hashtags(hashtag);
CREATE INDEX idx_restaurant_review_hashtags_review_id ON restaurant_review_hashtags(review_id);
CREATE INDEX idx_restaurant_review_hashtags_created_at ON restaurant_review_hashtags(created_at DESC);
```

**For most use cases, the `hashtags TEXT[]` field in the main table is sufficient.**

#### Optional: `restaurant_review_mentions` - Mention Analytics Table

Only create this table if you need:
- Complex notification system ("@username mentioned you")
- Efficient queries like "all reviews mentioning user X"
- Mention analytics (who mentions whom)
- Position tracking for UI highlighting

```sql
CREATE TABLE restaurant_review_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES restaurant_reviews(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES restaurant_users(id) ON DELETE CASCADE,
  start_position INTEGER,
  end_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT restaurant_review_mentions_unique UNIQUE (review_id, mentioned_user_id)
);

CREATE INDEX idx_restaurant_review_mentions_review_id ON restaurant_review_mentions(review_id);
CREATE INDEX idx_restaurant_review_mentions_user_id ON restaurant_review_mentions(mentioned_user_id);
```

**For most use cases, the `mentions JSONB` field in the main table is sufficient.**

---

### Database Functions & Triggers

#### 1. Update `likes_count` Trigger

```sql
-- Function to update likes_count when likes are added/removed
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE restaurant_reviews
    SET likes_count = likes_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE restaurant_reviews
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_review_likes_count
  AFTER INSERT OR DELETE ON restaurant_review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_likes_count();
```

#### 2. Update `replies_count` Trigger

```sql
-- Function to update replies_count when replies are added/removed
CREATE OR REPLACE FUNCTION update_review_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_review_id IS NOT NULL THEN
    UPDATE restaurant_reviews
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_review_id IS NOT NULL THEN
    UPDATE restaurant_reviews
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.parent_review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_review_replies_count
  AFTER INSERT OR DELETE ON restaurant_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_replies_count();
```

#### 3. Update `updated_at` Trigger

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for restaurant_reviews
CREATE TRIGGER trigger_update_restaurant_reviews_updated_at
  BEFORE UPDATE ON restaurant_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 4. Set `published_at` on Approval

```sql
-- Function to set published_at when status changes to 'approved'
CREATE OR REPLACE FUNCTION set_review_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.published_at = NOW();
  ELSIF NEW.status != 'approved' THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_set_review_published_at
  BEFORE UPDATE ON restaurant_reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_published_at();
```

---

## Example Queries

### 1. Get Top-Level Reviews for a Restaurant (Paginated)

```sql
SELECT 
  r.id,
  r.title,
  r.content,
  r.rating,
  r.images, -- JSONB array, no JOIN needed!
  r.likes_count,
  r.replies_count,
  r.hashtags,
  r.mentions, -- JSONB array
  r.palates,
  r.created_at,
  r.published_at,
  u.id as author_id,
  u.username,
  u.display_name,
  u.profile_image,
  jsonb_array_length(r.images) as image_count -- Count images from JSONB array
FROM restaurant_reviews r
INNER JOIN restaurant_users u ON r.author_id = u.id
WHERE r.restaurant_uuid = $1
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
  AND r.parent_review_id IS NULL -- Top-level reviews only
ORDER BY r.is_pinned DESC, r.created_at DESC
LIMIT $2 OFFSET $3;
```

### 2. Get Direct Replies to a Review

```sql
SELECT 
  r.id,
  r.content,
  r.images, -- Replies can also have images
  r.mentions, -- Replies can mention users
  r.likes_count,
  r.created_at,
  u.id as author_id,
  u.username,
  u.display_name,
  u.profile_image
FROM restaurant_reviews r
INNER JOIN restaurant_users u ON r.author_id = u.id
WHERE r.parent_review_id = $1 -- Direct children only
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
ORDER BY r.created_at ASC; -- Oldest first for conversation flow
```

### 2b. Get All Nested Replies (Recursive CTE)

For unlimited nesting depth:

```sql
WITH RECURSIVE review_tree AS (
  -- Base case: direct replies
  SELECT 
    id,
    parent_review_id,
    content,
    images,
    mentions,
    author_id,
    created_at,
    1 as depth,
    ARRAY[id] as path -- Prevent cycles
  FROM restaurant_reviews
  WHERE parent_review_id = $1 -- Starting review ID
    AND deleted_at IS NULL
    AND status = 'approved'
  
  UNION ALL
  
  -- Recursive case: nested replies
  SELECT 
    r.id,
    r.parent_review_id,
    r.content,
    r.images,
    r.mentions,
    r.author_id,
    r.created_at,
    rt.depth + 1,
    rt.path || r.id -- Add to path
  FROM restaurant_reviews r
  INNER JOIN review_tree rt ON r.parent_review_id = rt.id
  WHERE r.deleted_at IS NULL
    AND r.status = 'approved'
    AND r.id != ALL(rt.path) -- Prevent cycles
    AND rt.depth < 10 -- Limit depth for safety
)
SELECT 
  rt.*,
  u.username,
  u.display_name,
  u.profile_image
FROM review_tree rt
INNER JOIN restaurant_users u ON rt.author_id = u.id
ORDER BY rt.path; -- Maintains hierarchical order
```

### 3. Get Reviews with User Like Status

```sql
SELECT 
  r.*,
  u.username,
  u.display_name,
  u.profile_image,
  CASE WHEN l.id IS NOT NULL THEN TRUE ELSE FALSE END as user_liked
FROM restaurant_reviews r
INNER JOIN restaurant_users u ON r.author_id = u.id
LEFT JOIN restaurant_review_likes l ON r.id = l.review_id AND l.user_id = $1
WHERE r.restaurant_uuid = $2
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
  AND r.parent_review_id IS NULL
ORDER BY r.created_at DESC;
```

### 4. Get Trending Hashtags (Last 7 Days) - Using Array Field

```sql
SELECT 
  unnest(hashtags) as hashtag,
  COUNT(*) as review_count
FROM restaurant_reviews
WHERE created_at > NOW() - INTERVAL '7 days'
  AND deleted_at IS NULL
  AND status = 'approved'
  AND hashtags IS NOT NULL
  AND array_length(hashtags, 1) > 0
GROUP BY hashtag
ORDER BY review_count DESC
LIMIT 20;
```

**Note:** If you created the optional `restaurant_review_hashtags` table, you can use:
```sql
SELECT 
  hashtag,
  COUNT(*) as review_count
FROM restaurant_review_hashtags
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY hashtag
ORDER BY review_count DESC
LIMIT 20;
```

### 5. Search Reviews by Hashtag

```sql
SELECT DISTINCT
  r.*,
  u.username,
  u.display_name
FROM restaurant_reviews r
INNER JOIN restaurant_users u ON r.author_id = u.id
WHERE r.hashtags @> ARRAY[$1] -- Array contains operator
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
  AND r.parent_review_id IS NULL
ORDER BY r.created_at DESC
LIMIT 20;
```

### 6. Get User's Reviews

```sql
SELECT 
  r.*,
  res.title as restaurant_title,
  res.slug as restaurant_slug
FROM restaurant_reviews r
INNER JOIN restaurants res ON r.restaurant_uuid = res.uuid
WHERE r.author_id = $1
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
  AND r.parent_review_id IS NULL
ORDER BY r.created_at DESC
LIMIT $2 OFFSET $3;
```

### 7. Get Reviews with Images (Simplified - No JOIN)

```sql
SELECT 
  r.*,
  u.username,
  u.display_name,
  r.images, -- Already included as JSONB array, no JOIN needed!
  jsonb_array_length(r.images) as image_count
FROM restaurant_reviews r
INNER JOIN restaurant_users u ON r.author_id = u.id
WHERE r.restaurant_uuid = $1
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
  AND r.parent_review_id IS NULL
  AND jsonb_array_length(r.images) > 0 -- Only reviews with images
ORDER BY r.created_at DESC;
```

### 8. Get First Image URL from Each Review

```sql
SELECT 
  id,
  title,
  images->0->>'url' as first_image_url,
  images->0->>'thumbnail_url' as first_thumbnail_url,
  images->0->>'alt_text' as first_image_alt
FROM restaurant_reviews
WHERE jsonb_array_length(images) > 0
  AND deleted_at IS NULL
  AND status = 'approved';
```

### 9. Find Reviews Mentioning a Specific User

```sql
SELECT 
  r.*,
  u.username as author_username,
  u.display_name as author_display_name
FROM restaurant_reviews r
INNER JOIN restaurant_users u ON r.author_id = u.id
WHERE r.mentions @> '[{"user_id": "550e8400-e29b-41d4-a716-446655440000"}]'::jsonb
  AND r.deleted_at IS NULL
  AND r.status = 'approved'
ORDER BY r.created_at DESC;
```

### 10. Check if User Liked a Review/Reply

```sql
SELECT 
  r.*,
  CASE WHEN l.id IS NOT NULL THEN TRUE ELSE FALSE END as user_liked
FROM restaurant_reviews r
LEFT JOIN restaurant_review_likes l 
  ON r.id = l.review_id 
  AND l.user_id = $1  -- Current user ID
WHERE r.id = $2;  -- Review or reply ID
```

### 11. Like a Review/Reply

```sql
-- Insert like (trigger automatically increments likes_count)
INSERT INTO restaurant_review_likes (review_id, user_id)
VALUES ($1, $2)  -- review_id, user_id
RETURNING id, created_at;

-- If user already liked, this will fail due to UNIQUE constraint
-- Handle error or use ON CONFLICT for toggle behavior
```

### 12. Unlike a Review/Reply

```sql
-- Delete like (trigger automatically decrements likes_count)
DELETE FROM restaurant_review_likes
WHERE review_id = $1  -- Review or reply ID
  AND user_id = $2;   -- Current user ID

-- Returns number of rows deleted (1 = success, 0 = user didn't like it)
```

### 13. Toggle Like/Unlike (Single Query)

```sql
-- Like if not exists, unlike if exists (PostgreSQL UPSERT)
INSERT INTO restaurant_review_likes (review_id, user_id)
VALUES ($1, $2)
ON CONFLICT (review_id, user_id)  -- UNIQUE constraint
DO DELETE  -- If already liked, delete it (unlike)
RETURNING 
  CASE 
    WHEN (SELECT COUNT(*) FROM restaurant_review_likes WHERE review_id = $1 AND user_id = $2) > 0 
    THEN 'liked' 
    ELSE 'unliked' 
  END as action;
```

### 14. Get All Users Who Liked a Review/Reply

```sql
SELECT 
  l.*,
  u.id as user_id,
  u.username,
  u.display_name,
  u.profile_image
FROM restaurant_review_likes l
INNER JOIN restaurant_users u ON l.user_id = u.id
WHERE l.review_id = $1  -- Review or reply ID
ORDER BY l.created_at DESC;
```

### 15. Get Like Count (Verification)

```sql
-- Denormalized count (fast, used in queries)
SELECT likes_count 
FROM restaurant_reviews 
WHERE id = $1;

-- Actual count from likes table (for verification)
SELECT COUNT(*) as actual_likes_count
FROM restaurant_review_likes
WHERE review_id = $1
  AND EXISTS (
    SELECT 1 FROM restaurant_reviews 
    WHERE id = $1 
      AND deleted_at IS NULL
  );
```

---

## GraphQL Schema Examples

### Query: Get Restaurant Reviews

```graphql
query GetRestaurantReviews(
  $restaurantUuid: uuid!
  $limit: Int = 10
  $offset: Int = 0
) {
  restaurant_reviews(
    where: {
      restaurant_uuid: { _eq: $restaurantUuid }
      deleted_at: { _is_null: true }
      status: { _eq: "approved" }
      parent_review_id: { _is_null: true }
    }
    order_by: [{ is_pinned: desc }, { created_at: desc }]
    limit: $limit
    offset: $offset
  ) {
    id
    title
    content
    rating
    likes_count
    replies_count
    hashtags
    mentions
    palates
    images
    created_at
    published_at
    author {
      id
      username
      display_name
      profile_image
    }
    restaurant {
      id
      title
      slug
    }
  }
  restaurant_reviews_aggregate(
    where: {
      restaurant_uuid: { _eq: $restaurantUuid }
      deleted_at: { _is_null: true }
      status: { _eq: "approved" }
      parent_review_id: { _is_null: true }
    }
  ) {
    aggregate {
      count
    }
  }
}
```

### Query: Get Review Replies

```graphql
query GetReviewReplies($reviewId: uuid!) {
  restaurant_reviews(
    where: {
      parent_review_id: { _eq: $reviewId }
      deleted_at: { _is_null: true }
      status: { _eq: "approved" }
    }
    order_by: { created_at: asc }
  ) {
    id
    content
    likes_count
    created_at
    author {
      id
      username
      display_name
      profile_image
    }
  }
}
```

### Mutation: Create Review

```graphql
mutation CreateReview($object: restaurant_reviews_insert_input!) {
  insert_restaurant_reviews_one(object: $object) {
    id
    title
    content
    rating
    status
    created_at
    author {
      id
      username
      display_name
    }
  }
}
```

### Mutation: Like Review

```graphql
mutation LikeReview($reviewId: uuid!, $userId: uuid!) {
  insert_restaurant_review_likes_one(
    object: {
      review_id: $reviewId
      user_id: $userId
    }
  ) {
    id
    created_at
  }
}
```

### Mutation: Unlike Review

```graphql
mutation UnlikeReview($reviewId: uuid!, $userId: uuid!) {
  delete_restaurant_review_likes(
    where: {
      review_id: { _eq: $reviewId }
      user_id: { _eq: $userId }
    }
  ) {
    affected_rows  # Returns 1 if unlike successful, 0 if not found
  }
}
```

### Mutation: Toggle Like/Unlike (Single Mutation)

```graphql
# First, check if liked
query CheckIfLiked($reviewId: uuid!, $userId: uuid!) {
  restaurant_review_likes(
    where: {
      review_id: { _eq: $reviewId }
      user_id: { _eq: $userId }
    }
    limit: 1
  ) {
    id
  }
}

# Then like or unlike based on result
# If exists: use UnlikeReview mutation
# If not exists: use LikeReview mutation
```

### Query: Get Review with Like Status

```graphql
query GetReviewWithLikeStatus($reviewId: uuid!, $userId: uuid!) {
  restaurant_reviews_by_pk(id: $reviewId) {
    id
    title
    content
    rating
    likes_count
    images
    hashtags
    created_at
    author {
      id
      username
      display_name
      profile_image
    }
    # Check if current user liked this review
    restaurant_review_likes(
      where: { user_id: { _eq: $userId } }
      limit: 1
    ) {
      id
      created_at
    }
  }
}
```

### Query: Get All Likes for a Review

```graphql
query GetReviewLikes($reviewId: uuid!, $limit: Int = 20, $offset: Int = 0) {
  restaurant_review_likes(
    where: { review_id: { _eq: $reviewId } }
    order_by: { created_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    created_at
    user {
      id
      username
      display_name
      profile_image
    }
  }
  restaurant_review_likes_aggregate(
    where: { review_id: { _eq: $reviewId } }
  ) {
    aggregate {
      count
    }
  }
}
```

---

## Migration from WordPress

### Prerequisites

**Important:** Before creating the `restaurant_reviews` table, ensure the `restaurants` table exists with a UUID column:

```sql
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY,  -- Primary key (can be INTEGER for WordPress compatibility)
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),  -- UUID for foreign key references
  -- ... other restaurant fields
);
```

**Note:** The `restaurant_uuid` field in `restaurant_reviews` references `restaurants.uuid` (UUID) for consistency with other foreign keys (`author_id`, `parent_review_id`). If your `restaurants` table uses `id` as UUID instead of a separate `uuid` column, change the foreign key to `REFERENCES restaurants(id)`.

### Data Migration Strategy

1. **Map WordPress Comments to Reviews:**
   ```sql
   -- Example migration query (run in migration script, not directly)
   INSERT INTO restaurant_reviews (
     id,
     restaurant_uuid, -- Map from WordPress post ID to restaurants.uuid (lookup restaurants.uuid WHERE restaurants.id = comment_post_ID)
     author_id, -- Map from comment_author_email to restaurant_users.id (UUID)
     parent_review_id, -- Map from comment_parent (0 = NULL, else map to UUID)
     title, -- From ACF field reviewMainTitle
     content, -- From comment_content
     rating, -- From ACF field reviewStars (convert to DECIMAL)
     palates, -- From ACF field palates (convert to JSONB)
     hashtags, -- From ACF field hashtags (convert to TEXT[])
     status, -- Map comment_approved: 0 = 'pending', 1 = 'approved'
     created_at, -- From comment_date
     published_at -- From comment_date if approved
   )
   SELECT 
     gen_random_uuid(),
     (SELECT uuid FROM restaurants WHERE id = c.comment_post_ID), -- Lookup UUID from restaurants table
     -- ... mapping logic for author_id (UUID from restaurant_users table)
     -- ... rest of mapping logic
   FROM wp_comments c
   WHERE c.comment_type = 'listing';
   ```
   
   **Note:** The migration maps WordPress post IDs (`comment_post_ID`) to `restaurants.uuid` by looking up the UUID from the restaurants table. Ensure the `restaurants` table has been populated with UUIDs before running this migration.

2. **Migrate Images:**
   ```sql
   -- Map ACF reviewImages field to restaurant_reviews.images JSONB array
   -- Extract image URLs from WordPress media library and convert to JSONB array format
   -- Example structure: [{"id": "uuid", "url": "...", "thumbnail_url": "...", "alt_text": "...", "display_order": 0}]
   ```

3. **Migrate Likes:**
   ```sql
   -- Map from wp_commentmeta or custom likes table
   -- Create entries in restaurant_review_likes
   ```

---

## Hasura Permissions

### Public Role (Read-Only)

```yaml
restaurant_reviews:
  select:
    - role: public
      permission:
        filter:
          deleted_at:
            _is_null: true
          status:
            _eq: "approved"
        columns:
          - id
          - title
          - content
          - rating
          - likes_count
          - replies_count
          - hashtags
          - mentions
          - images
          - palates
          - created_at
          - published_at
        allow_aggregations: true
```

### User Role (Create/Update Own Reviews)

```yaml
restaurant_reviews:
  insert:
    - role: user
      permission:
        check:
          author_id:
            _eq: X-Hasura-User-Id
        columns:
          - restaurant_uuid
          - author_id
          - parent_review_id
          - title
          - content
          - rating
          - palates
          - hashtags
          - images
          - mentions
          - status
        set:
          author_id: X-Hasura-User-Id
          created_at: "now()"
  
  update:
    - role: user
      permission:
        filter:
          author_id:
            _eq: X-Hasura-User-Id
          status:
            _in: ["draft", "pending"]
        columns:
          - title
          - content
          - rating
          - palates
          - hashtags
          - images
          - mentions
          - status
        set:
          updated_at: "now()"
  
  delete:
    - role: user
      permission:
        filter:
          author_id:
            _eq: X-Hasura-User-Id
        columns:
          - deleted_at
        set:
          deleted_at: "now()"
```

### Admin Role (Full Access)

```yaml
restaurant_reviews:
  select:
    - role: admin
      permission:
        columns: "*"
        filter: {}
  
  insert:
    - role: admin
      permission:
        columns: "*"
        check: {}
  
  update:
    - role: admin
      permission:
        columns: "*"
        filter: {}
  
  delete:
    - role: admin
      permission:
        columns: "*"
        filter: {}
```

---

## Performance Considerations

### 1. Pagination
- Use cursor-based pagination for large datasets
- Index on `created_at DESC` for chronological feeds
- Limit page size (e.g., 20 reviews per page)

### 2. Denormalization
- `likes_count` and `replies_count` are denormalized for fast queries
- Updated automatically via triggers when likes/replies are added/removed
- **Like/Unlike**: INSERT/DELETE from `restaurant_review_likes` → trigger updates `likes_count`
- **Replies**: INSERT/DELETE from `restaurant_reviews` with `parent_review_id` → trigger updates `replies_count`
- Consider caching for high-traffic endpoints
- For verification, can compare denormalized count with actual COUNT(*) from related tables

### 3. Nested Replies (Parent/Child Relationship)
- **Parent/Child Structure**: `parent_review_id` enables unlimited nesting depth
- **Top-level reviews**: `parent_review_id = NULL`
- **Direct replies**: `parent_review_id = <review_id>`
- **Nested replies**: `parent_review_id = <parent_reply_id>` (unlimited depth)
- Limit nesting depth in UI (e.g., max 3-5 levels) for better UX
- Use recursive CTEs for deep nesting if needed
- Consider flattening for very deep threads
- Partial indexes optimize queries for top-level vs replies

### 4. Image Optimization
- Store images as JSONB array in main table (no separate table needed)
- Include thumbnails in image objects: `{"url": "...", "thumbnail_url": "...", ...}`
- Use CDN for image delivery
- Lazy load images in frontend
- GIN index on `images` enables efficient queries

### 5. Full-Text Search
- Add `tsvector` column for content search:
  ```sql
  ALTER TABLE restaurant_reviews 
  ADD COLUMN content_search tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
  
  CREATE INDEX idx_restaurant_reviews_content_search 
  ON restaurant_reviews USING GIN(content_search);
  ```

---

## Scalability Features

1. **Horizontal Scaling**: UUID primary keys support distributed systems
2. **Soft Deletes**: Preserve data for analytics while hiding from users
3. **Status Workflow**: Support moderation and approval processes
4. **Denormalized Counts**: Fast queries without expensive aggregations
5. **Array/JSONB Fields**: Efficient storage and querying of flexible data
6. **Partial Indexes**: Optimize queries for active (non-deleted) records
7. **Trigger-Based Updates**: Automatic count maintenance

---

## Future Enhancements

1. **Review Reactions**: Add emoji reactions (👍, ❤️, 😂) beyond simple likes
2. **Review Tags**: Categorize reviews (e.g., "service", "food", "ambiance")
3. **Review Verification**: Mark verified reviews (e.g., confirmed visit)
4. **Review Reports**: Allow users to report inappropriate content
5. **Review Analytics**: Track views, engagement rates, trending reviews
6. **Review Recommendations**: Suggest reviews based on user preferences
7. **Review Drafts Versioning**: Save multiple versions of drafts
8. **Review Scheduling**: Schedule reviews to be published at a future date

---

## Notes

1. **Rating System**: Supports 0.0 to 5.0 (allows half stars like 4.5)
2. **Content Length**: Minimum 10 characters to prevent spam
3. **Hashtag Normalization**: Store hashtags without `#` and lowercase for consistency (e.g., `['foodie', 'delicious']`)
4. **Image Storage**: Images stored as JSONB array in main table - no separate table needed. Supports multiple images per review with ordering.
5. **Mention Storage**: Mentions stored as JSONB array in main table - no separate table needed unless advanced analytics required.
6. **Soft Deletes**: Always filter by `deleted_at IS NULL` in queries
7. **Status Workflow**: `draft` → `pending` → `approved` → `published_at` set automatically
8. **Nested Replies**: Unlimited depth via `parent_review_id` self-reference, but UI should limit for UX (recommend max 3-5 levels)
9. **Simplified Structure**: Images, hashtags, and mentions stored in main table for simpler queries and better performance
10. **Parent/Child Relationship**: 
    - Top-level reviews: `parent_review_id = NULL`
    - Direct replies: `parent_review_id = <review_id>`
    - Nested replies: `parent_review_id = <parent_reply_id>` (supports unlimited nesting)

---

## Appendix: Complete SQL Schema

### Simplified Table Structure

**Core Tables:**
1. `restaurant_reviews` - Main table (includes images, hashtags, mentions as JSONB/arrays)
2. `restaurant_review_likes` - Likes/engagement tracking

**Optional Tables (only if advanced analytics needed):**
3. `restaurant_review_hashtags` - Hashtag analytics (optional)
4. `restaurant_review_mentions` - Mention analytics (optional)

### Key Simplifications

1. **Images**: Stored as JSONB array in `restaurant_reviews.images` - no separate table
2. **Hashtags**: Stored as TEXT[] array in `restaurant_reviews.hashtags` - separate table optional
3. **Mentions**: Stored as JSONB array in `restaurant_reviews.mentions` - separate table optional
4. **Replies**: Self-referencing via `parent_review_id` - unlimited nesting depth

See the SQL commands above for the complete schema. All tables, indexes, triggers, and constraints are included.

