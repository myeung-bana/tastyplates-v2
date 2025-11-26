# Restaurant Users Table Schema
## Hasura Database Schema for User Management

**Document Version:** 1.1  
**Date:** 2024  
**Purpose:** User table for restaurant review platform with Instagram/Xiaohongshu-style experience

---

## Table: `restaurant_users`

This table stores all user accounts with their profile information in a single table for better performance and simpler queries.

### Combined User and Profile Fields

```sql
CREATE TABLE restaurant_users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Firebase Authentication
  firebase_uuid VARCHAR(255) UNIQUE NOT NULL, -- Firebase UID (Google providerAccountId for OAuth, Firebase UID for email/password)
  
  -- WordPress User Reference (for migration purposes)
  wp_user_id BIGINT UNIQUE, -- Reference to WordPress user ID during migration
  
  -- Authentication Fields
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for OAuth users (authenticate via Firebase)
  user_nicename VARCHAR(255), -- URL-friendly username
  
  -- Display Information
  display_name VARCHAR(255),
  
  -- OAuth Flags (Legacy - can be removed after migration)
  is_google_user BOOLEAN DEFAULT FALSE,
  google_auth BOOLEAN DEFAULT FALSE,
  google_token TEXT, -- Google OAuth token (optional, for future use)
  
  -- Authentication Method
  auth_method VARCHAR(50), -- Primary authentication method: 'password', 'google.com', 'facebook.com', 'twitter.com', 'github.com', 'apple.com', 'phone', etc.
  
  -- Profile Image
  profile_image JSONB, -- Profile image data: {"url": "https://...", "alt_text": "..."} or simple URL string
  
  -- Personal Information
  about_me TEXT, -- User bio/description (textarea field)
  birthdate DATE, -- User birthdate (format: Y-m-d)
  gender VARCHAR(50), -- User gender
  custom_gender VARCHAR(50), -- Custom gender option
  pronoun VARCHAR(50), -- User pronoun preference
  
  -- Location Information
  address TEXT, -- User's primary area/address
  zip_code VARCHAR(20), -- Area Code/Zip Code/Postal Code
  latitude DECIMAL(10, 8), -- User location latitude
  longitude DECIMAL(11, 8), -- User location longitude
  
  -- Preferences
  palates JSONB, -- Array of palate preferences: ["Italian", "Japanese", "Korean"] or [{"id": "uuid", "name": "Italian", "slug": "italian"}, ...]
  language_preference VARCHAR(10) DEFAULT 'en', -- User language preference (e.g., 'en', 'zh', 'fil')
  
  -- Onboarding Status
  onboarding_complete BOOLEAN DEFAULT FALSE NOT NULL, -- Whether user has completed the onboarding flow
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete support
  
  -- Constraints
  CONSTRAINT restaurant_users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT restaurant_users_firebase_uuid_check CHECK (firebase_uuid IS NOT NULL AND firebase_uuid != ''),
  CONSTRAINT restaurant_users_latitude_check CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT restaurant_users_longitude_check CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- Indexes for Performance
CREATE INDEX idx_restaurant_users_firebase_uuid ON restaurant_users(firebase_uuid);
CREATE INDEX idx_restaurant_users_wp_user_id ON restaurant_users(wp_user_id);
CREATE INDEX idx_restaurant_users_email ON restaurant_users(email);
CREATE INDEX idx_restaurant_users_username ON restaurant_users(username);
CREATE INDEX idx_restaurant_users_created_at ON restaurant_users(created_at DESC);
CREATE INDEX idx_restaurant_users_deleted_at ON restaurant_users(deleted_at) WHERE deleted_at IS NULL; -- Partial index for active users
CREATE INDEX idx_restaurant_users_location ON restaurant_users USING GIST(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL; -- PostGIS for location queries
CREATE INDEX idx_restaurant_users_palates ON restaurant_users USING GIN(palates); -- GIN index for JSONB array queries
CREATE INDEX idx_restaurant_users_auth_method ON restaurant_users(auth_method) WHERE deleted_at IS NULL; -- Index for analytics queries on authentication methods
```

---

## Table: `restaurant_user_palates` (Optional Junction Table)

Many-to-many relationship between users and palate preferences. This is optional if using JSONB `palates` field in `restaurant_users`. Use this table if you need:
- Foreign key constraints to palates table
- Complex queries with palate relationships
- Audit trails of palate selections

```sql
CREATE TABLE restaurant_user_palates (
  user_id UUID REFERENCES restaurant_users(id) ON DELETE CASCADE,
  palate_id UUID REFERENCES palates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, palate_id)
);

CREATE INDEX idx_restaurant_user_palates_user ON restaurant_user_palates(user_id);
CREATE INDEX idx_restaurant_user_palates_palate ON restaurant_user_palates(palate_id);
```

**Note:** If using JSONB `palates` field, this junction table is optional. Choose one approach:
- **JSONB approach:** Simpler, faster for reads, easier to update, but no referential integrity
- **Junction table approach:** Better for complex relationships, referential integrity, but requires joins

---

## Table: `restaurant_user_ethnic_tastes` (Junction Table)

Many-to-many relationship for ethnic taste preferences (from ACF field `ethnic_taste`).

```sql
CREATE TABLE restaurant_user_ethnic_tastes (
  user_id UUID REFERENCES restaurant_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- Reference to l_category taxonomy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id)
);

CREATE INDEX idx_restaurant_user_ethnic_tastes_user ON restaurant_user_ethnic_tastes(user_id);
CREATE INDEX idx_restaurant_user_ethnic_tastes_category ON restaurant_user_ethnic_tastes(category_id);
```

---

## Functions and Triggers

### Auto-update `updated_at` timestamp

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_restaurant_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for restaurant_users
CREATE TRIGGER trigger_update_restaurant_users_updated_at
  BEFORE UPDATE ON restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_users_updated_at();
```

---

## Hasura Metadata Configuration

### Relationships

```yaml
# restaurant_users relationships
restaurant_users:
  - user_palates (many-to-many, via restaurant_user_palates)
  - user_ethnic_tastes (many-to-many, via restaurant_user_ethnic_tastes)
  - reviews (one-to-many, via reviews.author_id)
  - favorites (many-to-many, via user_favorites)
  - checkins (many-to-many, via user_checkins)
  - following (many-to-many, via user_follows where follower_id = user.id)
  - followers (many-to-many, via user_follows where user_id = user.id)
  - review_likes (many-to-many, via review_likes)
```

### Permissions

```yaml
# Example Hasura permissions for restaurant_users
restaurant_users:
  select:
    - role: user
      permission:
        filter:
          id:
            _eq: X-Hasura-User-Id
        columns:
          - id
          - username
          - email
          - display_name
          - firebase_uuid
          - about_me
          - birthdate
          - gender
          - profile_image
          - language_preference
          - palates
          - created_at
        allow_aggregations: false
    
    - role: public
      permission:
        filter:
          deleted_at:
            _is_null: true
        columns:
          - id
          - username
          - display_name
          - about_me
          - profile_image
          - palates
          - auth_method
          - created_at
        allow_aggregations: false
  
  insert:
    - role: user
      permission:
        check:
          firebase_uuid:
            _eq: X-Hasura-User-Id
        columns:
          - firebase_uuid
          - username
          - email
          - password_hash
          - display_name
        set:
          created_at: "now()"
  
  update:
    - role: user
      permission:
        filter:
          id:
            _eq: X-Hasura-User-Id
        columns:
          - display_name
          - user_nicename
          - about_me
          - birthdate
          - gender
          - custom_gender
          - pronoun
          - address
          - zip_code
          - latitude
          - longitude
          - language_preference
          - profile_image
          - palates
          - auth_method
          - updated_at
        set:
          updated_at: "now()"
  
  delete:
    - role: admin
      permission:
        filter: {}
```

---

## Migration Notes

### From WordPress to Hasura

1. **Firebase UUID Mapping:**
   - For Google OAuth users: `firebase_uuid` = Google `providerAccountId`
   - For email/password users: `firebase_uuid` = Firebase Auth UID
   - For existing WordPress users without Firebase: Generate new Firebase UID or use WordPress user ID as temporary identifier

2. **Password Handling:**
   - OAuth users: `password_hash` = NULL (authenticate via Firebase)
   - Email/password users: Migrate WordPress password hash (if compatible) or require password reset

3. **Profile Data Migration:**
   - Migrate ACF fields from `wp_usermeta` directly into `restaurant_users` table
   - Convert `profile_image` attachment ID to JSONB format: `{"url": "...", "alt_text": "..."}` or simple URL string
   - Convert pipe-separated `palates` string to JSONB array: `["Italian", "Japanese", "Korean"]`
   - Convert `ethnic_taste` taxonomy IDs to `restaurant_user_ethnic_tastes` entries
   - Set `auth_method` based on existing flags:
     - If `is_google_user = TRUE` → `auth_method = 'google.com'`
     - If `password_hash IS NOT NULL` → `auth_method = 'password'`
     - Otherwise → `auth_method = 'unknown'` (to be updated manually)

---

## Example Queries

### Create New User (Registration)

```sql
-- Insert user with profile data, palates (JSONB), and profile_image (JSONB)
INSERT INTO restaurant_users (
  firebase_uuid,
  username,
  email,
  password_hash,
  display_name,
  is_google_user,
  google_auth,
  auth_method,
  about_me,
  birthdate,
  language_preference,
  palates,
  profile_image
) VALUES (
  'firebase-uid-12345', -- From Firebase Auth
  'johndoe',
  'john@example.com',
  NULL, -- OAuth user, no password
  'John Doe',
  TRUE,
  TRUE,
  'google.com', -- Authentication method
  'Food enthusiast',
  '1990-01-15',
  'en',
  '["Italian", "Japanese", "Korean"]'::jsonb, -- Palates as JSONB array
  '{"url": "https://example.com/profile.jpg", "alt_text": "John Doe profile picture"}'::jsonb -- Profile image as JSONB object
) RETURNING id;
```

### Fetch User by Firebase UUID

```sql
SELECT 
  id,
  firebase_uuid,
  username,
  email,
  display_name,
  is_google_user,
  auth_method,
  about_me,
  birthdate,
  profile_image,
  language_preference,
  latitude,
  longitude,
  palates -- JSONB array
FROM restaurant_users
WHERE firebase_uuid = 'firebase-uid-12345'
  AND deleted_at IS NULL;
```

### Fetch User with Palates (JSONB)

```sql
SELECT 
  id,
  username,
  display_name,
  about_me,
  profile_image,
  palates -- JSONB array: ["Italian", "Japanese", "Korean"]
FROM restaurant_users
WHERE id = 'user-uuid';
```

### Query Users by Palate (JSONB)

```sql
-- Find users who have "Italian" in their palates array
SELECT 
  id,
  username,
  display_name,
  palates
FROM restaurant_users
WHERE palates @> '["Italian"]'::jsonb
  AND deleted_at IS NULL;

-- Find users who have any of the specified palates
SELECT 
  id,
  username,
  display_name,
  palates
FROM restaurant_users
WHERE palates ?| array['Italian', 'Japanese', 'Korean']
  AND deleted_at IS NULL;
```

### Update User Palates (JSONB)

```sql
-- Add a palate to the array
UPDATE restaurant_users
SET palates = palates || '["French"]'::jsonb
WHERE id = 'user-uuid';

-- Replace entire palates array
UPDATE restaurant_users
SET palates = '["Italian", "Japanese", "Korean"]'::jsonb
WHERE id = 'user-uuid';

-- Remove a specific palate from array
UPDATE restaurant_users
SET palates = palates - 'Italian'
WHERE id = 'user-uuid';
```

---

## GraphQL Query Examples

### Get Current User

```graphql
query GetCurrentUser($firebaseUuid: String!) {
  restaurant_users(where: { firebase_uuid: { _eq: $firebaseUuid } }) {
    id
    firebase_uuid
    username
    email
    display_name
    is_google_user
    auth_method # Authentication method: "password", "google.com", "facebook.com", etc.
    about_me
    birthdate
    gender
    pronoun
    language_preference
    profile_image # JSONB: {"url": "https://...", "alt_text": "..."} or simple URL string
    latitude
    longitude
    palates # JSONB array: ["Italian", "Japanese", "Korean"]
    created_at
  }
}
```

### Query Users by Palate (JSONB)

```graphql
query GetUsersByPalate($palate: String!) {
  restaurant_users(
    where: { 
      palates: { _contains: [$palate] }
      deleted_at: { _is_null: true }
    }
  ) {
    id
    username
    display_name
    palates
  }
}
```

### Create User (Registration)

```graphql
mutation CreateRestaurantUser($input: restaurant_users_insert_input!) {
  insert_restaurant_users_one(object: $input) {
    id
    firebase_uuid
    username
    email
    display_name
    about_me
    language_preference
    palates # JSONB array
    created_at
  }
}
```

**Example Input:**
```json
{
  "firebase_uuid": "firebase-uid-12345",
  "username": "johndoe",
  "email": "john@example.com",
  "display_name": "John Doe",
  "auth_method": "google.com",
  "palates": ["Italian", "Japanese", "Korean"],
  "profile_image": {
    "url": "https://example.com/profile.jpg",
    "alt_text": "John Doe profile picture"
  }
}
```

---

## Benefits of Combined Table

1. **Simpler Queries:** No joins needed for basic user profile data
2. **Better Performance:** Single table read instead of join operation
3. **Easier Maintenance:** All user data in one place
4. **Simpler Permissions:** Single table to manage permissions
5. **Atomic Updates:** Profile updates happen in one transaction

## JSONB Field Benefits

### Palates Field (JSONB)

1. **Flexible Storage:** Can store simple strings `["Italian", "Japanese"]` or complex objects `[{"id": "uuid", "name": "Italian", "slug": "italian"}]`
2. **Efficient Querying:** GIN index enables fast containment queries (`@>`, `?|`, `?&`)
3. **No Joins Required:** Palates are stored directly in the user record
4. **Easy Updates:** Simple JSONB operations to add/remove palates
5. **Type Safety:** JSONB validates JSON structure at database level

### Profile Image Field (JSONB)

1. **Flexible Storage:** Can store simple URL string `"https://example.com/image.jpg"` or object with metadata `{"url": "...", "alt_text": "...", "width": 200, "height": 200}`
2. **No Foreign Key Dependency:** No need to reference media table, can store external URLs
3. **Rich Metadata:** Store additional image information (alt_text, dimensions, etc.) in the same field
4. **Easy Updates:** Simple JSONB operations to update image data
5. **Type Safety:** JSONB validates JSON structure at database level

## Notes

1. **Firebase UUID Uniqueness:** The `firebase_uuid` field is UNIQUE and NOT NULL, ensuring each Firebase user maps to exactly one restaurant user.

2. **Soft Deletes:** The `deleted_at` field allows for soft deletes, preserving data while marking users as inactive.

3. **Password Security:** For OAuth users, `password_hash` is NULL. For email/password users, store hashed passwords (bcrypt recommended).

4. **Nullable Profile Fields:** All profile fields are nullable, allowing users to complete their profile gradually.

5. **Location Support:** Uses PostGIS extension for efficient location-based queries (requires `postgis` extension).

6. **Migration Path:** The `wp_user_id` field allows tracking during WordPress to Hasura migration.

7. **Authentication Method (`auth_method`):** Tracks the primary authentication provider used by the user:
   - **`password`**: Email/password authentication
   - **`google.com`**: Google Sign-In
   - **`facebook.com`**: Facebook Sign-In
   - **`twitter.com`**: Twitter Sign-In
   - **`github.com`**: GitHub Sign-In
   - **`apple.com`**: Apple Sign-In
   - **`phone`**: Phone number authentication
   - **`unknown`**: Fallback for edge cases
   
   This field enables analytics, support, and feature gating based on authentication method. The field is indexed for efficient queries.

8. **Palates Field (JSONB):** The `palates` field uses JSONB to store an array of palate preferences. This allows for:
   - **Simple array storage:** `["Italian", "Japanese", "Korean"]`
   - **Complex objects:** `[{"id": "uuid", "name": "Italian", "slug": "italian"}, ...]`
   - **Efficient querying** with JSONB operators:
     - `@>` - Contains (e.g., `palates @> '["Italian"]'`)
     - `?|` - Contains any of the keys/values (e.g., `palates ?| array['Italian', 'Japanese']`)
     - `?&` - Contains all of the keys/values
     - `-` - Remove key/value from JSONB
   - **GIN index** for fast array containment queries
   - The `restaurant_user_palates` junction table is optional and can be used if referential integrity is required

### JSONB Palates Format Examples

**Simple String Array (Recommended):**
```json
["Italian", "Japanese", "Korean"]
```

**Object Array (For additional metadata):**
```json
[
  {"id": "uuid-1", "name": "Italian", "slug": "italian"},
  {"id": "uuid-2", "name": "Japanese", "slug": "japanese"}
]
```

**Mixed Format (Not recommended, but possible):**
```json
["Italian", {"name": "Japanese", "slug": "japanese"}]
```

### JSONB Profile Image Format Examples

**Simple URL String (Recommended for basic use):**
```json
"https://example.com/profile.jpg"
```

**Object with Metadata (Recommended for production):**
```json
{
  "url": "https://example.com/profile.jpg",
  "alt_text": "User profile picture",
  "width": 200,
  "height": 200,
  "mime_type": "image/jpeg"
}
```

**Object with Multiple Sizes:**
```json
{
  "thumbnail": "https://example.com/profile-thumb.jpg",
  "medium": "https://example.com/profile-medium.jpg",
  "large": "https://example.com/profile-large.jpg",
  "alt_text": "User profile picture"
}
```

### Update Profile Image (JSONB)

```sql
-- Update profile image with object
UPDATE restaurant_users
SET profile_image = '{"url": "https://example.com/new-profile.jpg", "alt_text": "Updated profile"}'::jsonb
WHERE id = 'user-uuid';

-- Update profile image with simple URL
UPDATE restaurant_users
SET profile_image = '"https://example.com/new-profile.jpg"'::jsonb
WHERE id = 'user-uuid';

-- Update only the URL in existing profile_image object
UPDATE restaurant_users
SET profile_image = jsonb_set(profile_image, '{url}', '"https://example.com/updated.jpg"')
WHERE id = 'user-uuid';
```

---

**End of Document**

