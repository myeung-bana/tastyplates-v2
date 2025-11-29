# Wishlist and Check-in Tables Schema
## Hasura Database Schema for User Favorites and Check-ins

**Document Version:** 1.0  
**Date:** 2024  
**Purpose:** Junction tables for managing user favorites (wishlist) and check-ins for restaurants

---

## Table: `user_favorites`

This table stores the many-to-many relationship between users and their favorited restaurants (wishlist).

### Schema

```sql
CREATE TABLE user_favorites (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES restaurant_users(id) ON DELETE CASCADE,
  restaurant_uuid UUID NOT NULL REFERENCES restaurants(uuid) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, restaurant_uuid) -- Prevent duplicate favorites
);

-- Indexes for Performance
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_restaurant ON user_favorites(restaurant_uuid);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to `restaurant_users.id` |
| `restaurant_uuid` | UUID | Foreign key to `restaurants.uuid` |
| `created_at` | TIMESTAMPTZ | Timestamp when the restaurant was added to favorites |

---

## Table: `user_checkins`

This table stores the many-to-many relationship between users and restaurants they have checked in to.

### Schema

```sql
CREATE TABLE user_checkins (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES restaurant_users(id) ON DELETE CASCADE,
  restaurant_uuid UUID NOT NULL REFERENCES restaurants(uuid) ON DELETE CASCADE,
  
  -- Timestamps
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, restaurant_uuid) -- Prevent duplicate check-ins
);

-- Indexes for Performance
CREATE INDEX idx_user_checkins_user ON user_checkins(user_id);
CREATE INDEX idx_user_checkins_restaurant ON user_checkins(restaurant_uuid);
CREATE INDEX idx_user_checkins_checked_in_at ON user_checkins(checked_in_at DESC);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to `restaurant_users.id` |
| `restaurant_uuid` | UUID | Foreign key to `restaurants.uuid` |
| `checked_in_at` | TIMESTAMPTZ | Timestamp when the user checked in |

---

## Hasura Metadata Configuration

### Relationships

```yaml
# user_favorites relationships
user_favorites:
  - user (many-to-one, via user_id -> restaurant_users.id)
  - restaurant (many-to-one, via restaurant_uuid -> restaurants.uuid)

# user_checkins relationships
user_checkins:
  - user (many-to-one, via user_id -> restaurant_users.id)
  - restaurant (many-to-one, via restaurant_uuid -> restaurants.uuid)

# restaurant_users relationships (add these)
restaurant_users:
  - favorites (one-to-many, via user_favorites.user_id)
  - checkins (one-to-many, via user_checkins.user_id)

# restaurants relationships (add these)
restaurants:
  - favorited_by (one-to-many, via user_favorites.restaurant_uuid)
  - checked_in_by (one-to-many, via user_checkins.restaurant_uuid)
```

### Permissions

```yaml
# user_favorites permissions
user_favorites:
  select:
    - role: user
      permission:
        filter:
          user_id:
            _eq: X-Hasura-User-Id
        columns:
          - id
          - user_id
          - restaurant_uuid
          - created_at
        allow_aggregations: false
    
    - role: public
      permission:
        filter:
          restaurant_uuid:
            _eq: $restaurant_uuid
        columns:
          - id
          - user_id
          - created_at
        allow_aggregations: true
  
  insert:
    - role: user
      permission:
        check:
          user_id:
            _eq: X-Hasura-User-Id
        columns:
          - user_id
          - restaurant_uuid
        set:
          created_at: "now()"
  
  delete:
    - role: user
      permission:
        filter:
          user_id:
            _eq: X-Hasura-User-Id

# user_checkins permissions
user_checkins:
  select:
    - role: user
      permission:
        filter:
          user_id:
            _eq: X-Hasura-User-Id
        columns:
          - id
          - user_id
          - restaurant_uuid
          - checked_in_at
        allow_aggregations: false
    
    - role: public
      permission:
        filter:
          restaurant_uuid:
            _eq: $restaurant_uuid
        columns:
          - id
          - user_id
          - checked_in_at
        allow_aggregations: true
  
  insert:
    - role: user
      permission:
        check:
          user_id:
            _eq: X-Hasura-User-Id
        columns:
          - user_id
          - restaurant_uuid
        set:
          checked_in_at: "now()"
  
  delete:
    - role: user
      permission:
        filter:
          user_id:
            _eq: X-Hasura-User-Id
```

---

## SQL Query Examples

### Favorites (Wishlist)

#### Add Restaurant to Favorites

```sql
INSERT INTO user_favorites (user_id, restaurant_uuid)
VALUES ('user-uuid-123', 'restaurant-uuid-456')
ON CONFLICT (user_id, restaurant_uuid) DO NOTHING;
```

#### Remove Restaurant from Favorites

```sql
DELETE FROM user_favorites
WHERE user_id = 'user-uuid-123'
  AND restaurant_uuid = 'restaurant-uuid-456';
```

#### Check if User Has Favorited a Restaurant

```sql
SELECT EXISTS(
  SELECT 1 FROM user_favorites
  WHERE user_id = 'user-uuid-123'
    AND restaurant_uuid = 'restaurant-uuid-456'
) AS is_favorited;
```

#### Get All Favorites for a User

```sql
SELECT 
  uf.id,
  uf.created_at,
  r.uuid,
  r.title,
  r.slug,
  r.average_rating,
  r.ratings_count,
  r.price_range,
  r.featured_image_url
FROM user_favorites uf
JOIN restaurants r ON uf.restaurant_uuid = r.uuid
WHERE uf.user_id = 'user-uuid-123'
ORDER BY uf.created_at DESC;
```

#### Get All Users Who Favorited a Restaurant (Cross-viewing)

```sql
SELECT 
  uf.id,
  uf.created_at,
  u.id AS user_id,
  u.username,
  u.display_name,
  u.profile_image
FROM user_favorites uf
JOIN restaurant_users u ON uf.user_id = u.id
WHERE uf.restaurant_uuid = 'restaurant-uuid-456'
  AND u.deleted_at IS NULL
ORDER BY uf.created_at DESC;
```

#### Get Favorite Count for a Restaurant

```sql
SELECT COUNT(*) AS favorite_count
FROM user_favorites
WHERE restaurant_uuid = 'restaurant-uuid-456';
```

### Check-ins

#### Add Check-in

```sql
INSERT INTO user_checkins (user_id, restaurant_uuid)
VALUES ('user-uuid-123', 'restaurant-uuid-456')
ON CONFLICT (user_id, restaurant_uuid) DO NOTHING;
```

#### Remove Check-in

```sql
DELETE FROM user_checkins
WHERE user_id = 'user-uuid-123'
  AND restaurant_uuid = 'restaurant-uuid-456';
```

#### Check if User Has Checked In

```sql
SELECT EXISTS(
  SELECT 1 FROM user_checkins
  WHERE user_id = 'user-uuid-123'
    AND restaurant_uuid = 'restaurant-uuid-456'
) AS is_checked_in;
```

#### Get All Check-ins for a User

```sql
SELECT 
  uc.id,
  uc.checked_in_at,
  r.uuid,
  r.title,
  r.slug,
  r.average_rating,
  r.ratings_count,
  r.price_range,
  r.featured_image_url
FROM user_checkins uc
JOIN restaurants r ON uc.restaurant_uuid = r.uuid
WHERE uc.user_id = 'user-uuid-123'
ORDER BY uc.checked_in_at DESC;
```

#### Get All Users Who Checked In to a Restaurant (Cross-viewing)

```sql
SELECT 
  uc.id,
  uc.checked_in_at,
  u.id AS user_id,
  u.username,
  u.display_name,
  u.profile_image
FROM user_checkins uc
JOIN restaurant_users u ON uc.user_id = u.id
WHERE uc.restaurant_uuid = 'restaurant-uuid-456'
  AND u.deleted_at IS NULL
ORDER BY uc.checked_in_at DESC;
```

#### Get Check-in Count for a Restaurant

```sql
SELECT COUNT(*) AS checkin_count
FROM user_checkins
WHERE restaurant_uuid = 'restaurant-uuid-456';
```

---

## GraphQL Query Examples

### Favorites (Wishlist)

#### Check if User Has Favorited a Restaurant

```graphql
query CheckUserFavorite($user_id: uuid!, $restaurant_uuid: uuid!) {
  user_favorites(
    where: {
      user_id: { _eq: $user_id }
      restaurant_uuid: { _eq: $restaurant_uuid }
    }
    limit: 1
  ) {
    id
    created_at
  }
}
```

#### Get All Favorites for a User

```graphql
query GetUserFavorites($user_id: uuid!, $limit: Int, $offset: Int) {
  user_favorites(
    where: { user_id: { _eq: $user_id } }
    limit: $limit
    offset: $offset
    order_by: { created_at: desc }
  ) {
    id
    created_at
    restaurant {
      uuid
      title
      slug
      status
      average_rating
      ratings_count
      price_range
      featured_image_url
      address
    }
  }
  user_favorites_aggregate(where: { user_id: { _eq: $user_id } }) {
    aggregate {
      count
    }
  }
}
```

#### Get All Users Who Favorited a Restaurant (Cross-viewing)

```graphql
query GetRestaurantFavoritedBy($restaurant_uuid: uuid!, $limit: Int, $offset: Int) {
  user_favorites(
    where: { restaurant_uuid: { _eq: $restaurant_uuid } }
    limit: $limit
    offset: $offset
    order_by: { created_at: desc }
  ) {
    id
    created_at
    user {
      id
      username
      display_name
      profile_image
      palates
    }
  }
  user_favorites_aggregate(where: { restaurant_uuid: { _eq: $restaurant_uuid } }) {
    aggregate {
      count
    }
  }
}
```

#### Add Restaurant to Favorites

```graphql
mutation AddToFavorites($user_id: uuid!, $restaurant_uuid: uuid!) {
  insert_user_favorites_one(
    object: {
      user_id: $user_id
      restaurant_uuid: $restaurant_uuid
    }
  ) {
    id
    created_at
  }
}
```

#### Remove Restaurant from Favorites

```graphql
mutation RemoveFromFavorites($user_id: uuid!, $restaurant_uuid: uuid!) {
  delete_user_favorites(
    where: {
      user_id: { _eq: $user_id }
      restaurant_uuid: { _eq: $restaurant_uuid }
    }
  ) {
    affected_rows
  }
}
```

### Check-ins

#### Check if User Has Checked In

```graphql
query CheckUserCheckin($user_id: uuid!, $restaurant_uuid: uuid!) {
  user_checkins(
    where: {
      user_id: { _eq: $user_id }
      restaurant_uuid: { _eq: $restaurant_uuid }
    }
    limit: 1
  ) {
    id
    checked_in_at
  }
}
```

#### Get All Check-ins for a User

```graphql
query GetUserCheckins($user_id: uuid!, $limit: Int, $offset: Int) {
  user_checkins(
    where: { user_id: { _eq: $user_id } }
    limit: $limit
    offset: $offset
    order_by: { checked_in_at: desc }
  ) {
    id
    checked_in_at
    restaurant {
      uuid
      title
      slug
      status
      average_rating
      ratings_count
      price_range
      featured_image_url
      address
    }
  }
  user_checkins_aggregate(where: { user_id: { _eq: $user_id } }) {
    aggregate {
      count
    }
  }
}
```

#### Get All Users Who Checked In to a Restaurant (Cross-viewing)

```graphql
query GetRestaurantCheckedInBy($restaurant_uuid: uuid!, $limit: Int, $offset: Int) {
  user_checkins(
    where: { restaurant_uuid: { _eq: $restaurant_uuid } }
    limit: $limit
    offset: $offset
    order_by: { checked_in_at: desc }
  ) {
    id
    checked_in_at
    user {
      id
      username
      display_name
      profile_image
      palates
    }
  }
  user_checkins_aggregate(where: { restaurant_uuid: { _eq: $restaurant_uuid } }) {
    aggregate {
      count
    }
  }
}
```

#### Add Check-in

```graphql
mutation AddCheckin($user_id: uuid!, $restaurant_uuid: uuid!) {
  insert_user_checkins_one(
    object: {
      user_id: $user_id
      restaurant_uuid: $restaurant_uuid
    }
  ) {
    id
    checked_in_at
  }
}
```

#### Remove Check-in

```graphql
mutation RemoveCheckin($user_id: uuid!, $restaurant_uuid: uuid!) {
  delete_user_checkins(
    where: {
      user_id: { _eq: $user_id }
      restaurant_uuid: { _eq: $restaurant_uuid }
    }
  ) {
    affected_rows
  }
}
```

---

## API Endpoints

### Base URL

All API endpoints are relative to:
```
/api/v1/restaurant-users
```

### Toggle Favorite (Wishlist)

**Endpoint:** `POST /api/v1/restaurant-users/toggle-favorite`

**Request Body:**
```json
{
  "user_id": "user-uuid-123",
  "restaurant_slug": "pizza-palace",
  "restaurant_uuid": "restaurant-uuid-456" // Optional if slug is provided
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "saved", // or "unsaved"
    "restaurant_uuid": "restaurant-uuid-456"
  }
}
```

**Check Favorite Status:**
**Endpoint:** `GET /api/v1/restaurant-users/toggle-favorite?user_id={user_id}&restaurant_slug={slug}`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "saved", // or "unsaved"
    "restaurant_uuid": "restaurant-uuid-456"
  }
}
```

### Toggle Check-in

**Endpoint:** `POST /api/v1/restaurant-users/toggle-checkin`

**Request Body:**
```json
{
  "user_id": "user-uuid-123",
  "restaurant_slug": "pizza-palace",
  "restaurant_uuid": "restaurant-uuid-456" // Optional if slug is provided
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "checkedin", // or "uncheckedin"
    "restaurant_uuid": "restaurant-uuid-456"
  }
}
```

**Check Check-in Status:**
**Endpoint:** `GET /api/v1/restaurant-users/toggle-checkin?user_id={user_id}&restaurant_slug={slug}`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "checkedin", // or "uncheckedin"
    "restaurant_uuid": "restaurant-uuid-456"
  }
}
```

---

## Frontend Service Usage

### Using `restaurantUserService`

```typescript
import { restaurantUserService } from '@/app/api/v1/services/restaurantUserService';

// Toggle favorite
const response = await restaurantUserService.toggleFavorite({
  user_id: 'user-uuid-123',
  restaurant_slug: 'pizza-palace'
});

if (response.success) {
  console.log('Status:', response.data.status); // 'saved' or 'unsaved'
}

// Check favorite status
const statusResponse = await restaurantUserService.checkFavoriteStatus({
  user_id: 'user-uuid-123',
  restaurant_slug: 'pizza-palace'
});

if (statusResponse.success) {
  const isFavorite = statusResponse.data.status === 'saved';
}

// Toggle check-in
const checkinResponse = await restaurantUserService.toggleCheckin({
  user_id: 'user-uuid-123',
  restaurant_slug: 'pizza-palace'
});

if (checkinResponse.success) {
  console.log('Status:', checkinResponse.data.status); // 'checkedin' or 'uncheckedin'
}

// Check check-in status
const checkinStatusResponse = await restaurantUserService.checkCheckinStatus({
  user_id: 'user-uuid-123',
  restaurant_slug: 'pizza-palace'
});

if (checkinStatusResponse.success) {
  const isCheckedIn = checkinStatusResponse.data.status === 'checkedin';
}
```

---

## Benefits of Junction Table Approach

1. **Cross-viewing Support:** Easy to query "who favorited this restaurant" or "who checked in here"
2. **Scalability:** No array size limits, handles millions of relationships efficiently
3. **Data Integrity:** Foreign key constraints prevent orphaned data
4. **Flexible Queries:** Supports complex filters, aggregations, and analytics
5. **Metadata per Relationship:** Can store timestamps and additional metadata
6. **Concurrent Updates:** Row-level locking prevents race conditions
7. **Analytics-Friendly:** Easy to generate reports, counts, and trends

---

## Migration Notes

### From WordPress to Hasura

If migrating from WordPress:
1. Export existing favorites/check-ins from WordPress
2. Map WordPress user IDs to Hasura `restaurant_users.id` (via `wp_user_id` or `firebase_uuid`)
3. Map WordPress restaurant IDs to Hasura `restaurants.uuid`
4. Bulk insert into `user_favorites` and `user_checkins` tables

### Example Migration Script

```sql
-- Example: Migrate favorites from WordPress
INSERT INTO user_favorites (user_id, restaurant_uuid, created_at)
SELECT 
  ru.id AS user_id,
  r.uuid AS restaurant_uuid,
  wp_favorites.created_at
FROM wp_favorites
JOIN restaurant_users ru ON ru.wp_user_id = wp_favorites.user_id
JOIN restaurants r ON r.wp_restaurant_id = wp_favorites.restaurant_id
ON CONFLICT (user_id, restaurant_uuid) DO NOTHING;
```

---

## Best Practices

1. **Always use UUIDs:** Use `restaurant_uuid` instead of numeric IDs for consistency
2. **Handle conflicts:** Use `ON CONFLICT DO NOTHING` when inserting to prevent duplicates
3. **Index foreign keys:** Ensure indexes exist on `user_id` and `restaurant_uuid` for performance
4. **Cascade deletes:** Foreign keys with `ON DELETE CASCADE` automatically clean up relationships
5. **Validate input:** Always validate UUIDs before querying
6. **Use pagination:** For large lists, always use `limit` and `offset`
7. **Check status before toggle:** Query current status before toggling to provide better UX

---

## Error Handling

### Common Errors

1. **Invalid UUID format:** Ensure UUIDs match the format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. **Restaurant not found:** Check that restaurant exists and is published before adding to favorites
3. **User not found:** Verify user exists and is not soft-deleted
4. **Duplicate entry:** Handle gracefully (should not occur due to UNIQUE constraint)
5. **Foreign key violation:** Ensure both user and restaurant exist before creating relationships

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "details": [
    {
      "message": "Detailed error information"
    }
  ]
}
```

---

## Performance Considerations

1. **Indexes:** All foreign keys and commonly queried fields are indexed
2. **Pagination:** Always use pagination for lists to avoid loading large datasets
3. **Aggregations:** Use `_aggregate` for counts instead of fetching all records
4. **Caching:** Consider caching favorite/check-in status for frequently accessed restaurants
5. **Batch Operations:** For bulk operations, use transactions and batch inserts

---

## Notes

1. **Unique Constraint:** The `UNIQUE(user_id, restaurant_uuid)` constraint prevents duplicate favorites/check-ins
2. **Cascade Deletes:** When a user or restaurant is deleted, related favorites/check-ins are automatically removed
3. **Timestamps:** `created_at` and `checked_in_at` are automatically set to current timestamp on insert
4. **Status Values:** API returns `'saved'`/`'unsaved'` for favorites and `'checkedin'`/`'uncheckedin'` for check-ins
5. **Slug Support:** API endpoints support both `restaurant_uuid` and `restaurant_slug` for convenience

