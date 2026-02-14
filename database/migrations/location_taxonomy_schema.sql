-- ====================================================================
-- Location Taxonomy Schema
-- ====================================================================
-- 
-- Purpose: Convert client-side location constants to database taxonomy
-- Migration: From /constants/location.ts to database-driven system
-- Structure: Country (parent) → City (child)
--
-- Benefits:
-- - Dynamic location management without code changes
-- - Scalable to add new countries/cities via admin UI
-- - Better data consistency and validation
-- - Enables location-based filtering and search
-- - Supports multiple locations per restaurant
--
-- ====================================================================

-- ====================================================================
-- 1. Core Location Taxonomy Table
-- ====================================================================

CREATE TABLE IF NOT EXISTS restaurant_locations (
  id SERIAL PRIMARY KEY,
  
  -- Basic taxonomy fields (standard pattern)
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER REFERENCES restaurant_locations(id) ON DELETE CASCADE,
  
  -- Location-specific fields
  type VARCHAR(50) NOT NULL CHECK (type IN ('country', 'city')),
  short_label VARCHAR(10), -- e.g., "CA", "TO", "HK"
  flag_url VARCHAR(500), -- URL to flag image (e.g., https://flagcdn.com/ca.svg)
  currency VARCHAR(10), -- e.g., "CAD", "USD", "HKD"
  timezone VARCHAR(100), -- e.g., "America/Toronto", "Asia/Hong_Kong"
  
  -- Geographic coordinates (for cities)
  latitude DECIMAL(10, 8), -- e.g., 43.6532
  longitude DECIMAL(11, 8), -- e.g., -79.3832
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0, -- For custom sorting in UI
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- 2. Indexes for Performance
-- ====================================================================

-- Index for hierarchical queries (parent-child relationships)
CREATE INDEX idx_restaurant_locations_parent_id 
ON restaurant_locations(parent_id);

-- Index for slug lookups (URL-friendly identifiers)
CREATE INDEX idx_restaurant_locations_slug 
ON restaurant_locations(slug);

-- Index for type filtering (country vs city)
CREATE INDEX idx_restaurant_locations_type 
ON restaurant_locations(type);

-- Composite index for active locations by type
CREATE INDEX idx_restaurant_locations_active_type 
ON restaurant_locations(is_active, type, display_order);

-- Spatial index for coordinate-based queries (cities)
CREATE INDEX idx_restaurant_locations_coordinates 
ON restaurant_locations(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ====================================================================
-- 3. Junction Table: Restaurant-Location Relationship
-- ====================================================================

CREATE TABLE IF NOT EXISTS restaurant_location_assignments (
  id SERIAL PRIMARY KEY,
  
  -- Foreign keys
  restaurant_uuid UUID NOT NULL, -- Links to restaurant
  location_id INTEGER NOT NULL REFERENCES restaurant_locations(id) ON DELETE CASCADE,
  
  -- Relationship type
  is_primary BOOLEAN DEFAULT TRUE, -- Primary location for the restaurant
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate assignments
  UNIQUE(restaurant_uuid, location_id)
);

-- ====================================================================
-- 4. Indexes for Junction Table
-- ====================================================================

-- Index for finding restaurants by location
CREATE INDEX idx_restaurant_location_assignments_location 
ON restaurant_location_assignments(location_id);

-- Index for finding location(s) of a restaurant
CREATE INDEX idx_restaurant_location_assignments_restaurant 
ON restaurant_location_assignments(restaurant_uuid);

-- Index for primary location queries
CREATE INDEX idx_restaurant_location_assignments_primary 
ON restaurant_location_assignments(restaurant_uuid, is_primary)
WHERE is_primary = TRUE;

-- ====================================================================
-- 5. Triggers for Automatic Timestamp Updates
-- ====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for restaurant_locations
DROP TRIGGER IF EXISTS update_restaurant_locations_updated_at ON restaurant_locations;
CREATE TRIGGER update_restaurant_locations_updated_at
  BEFORE UPDATE ON restaurant_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for restaurant_location_assignments
DROP TRIGGER IF EXISTS update_restaurant_location_assignments_updated_at ON restaurant_location_assignments;
CREATE TRIGGER update_restaurant_location_assignments_updated_at
  BEFORE UPDATE ON restaurant_location_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 6. Seed Data: Countries
-- ====================================================================

INSERT INTO restaurant_locations (name, slug, type, short_label, flag_url, currency, timezone, display_order, is_active) VALUES
  ('Canada', 'canada', 'country', 'CA', 'https://flagcdn.com/ca.svg', 'CAD', 'America/Toronto', 1, TRUE),
  ('Malaysia', 'malaysia', 'country', 'MY', 'https://flagcdn.com/my.svg', 'MYR', 'Asia/Kuala_Lumpur', 2, TRUE),
  ('Hong Kong', 'hongkong', 'country', 'HK', 'https://flagcdn.com/hk.svg', 'HKD', 'Asia/Hong_Kong', 3, TRUE),
  ('China', 'china', 'country', 'CN', 'https://flagcdn.com/cn.svg', 'CNY', 'Asia/Shanghai', 4, TRUE),
  ('Philippines', 'philippines', 'country', 'PH', 'https://flagcdn.com/ph.svg', 'PHP', 'Asia/Manila', 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- 7. Seed Data: Cities (with parent references)
-- ====================================================================

-- Canada cities
INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Toronto', 'toronto', 'city', 'TO', id, 'https://flagcdn.com/ca.svg', 'CAD', 'America/Toronto', 43.6532, -79.3832, 1, TRUE
FROM restaurant_locations WHERE slug = 'canada'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Vancouver', 'vancouver', 'city', 'VAN', id, 'https://flagcdn.com/ca.svg', 'CAD', 'America/Vancouver', 49.2827, -123.1207, 2, TRUE
FROM restaurant_locations WHERE slug = 'canada'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Montreal', 'montreal', 'city', 'MTL', id, 'https://flagcdn.com/ca.svg', 'CAD', 'America/Toronto', 45.5017, -73.5673, 3, TRUE
FROM restaurant_locations WHERE slug = 'canada'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Calgary', 'calgary', 'city', 'YYC', id, 'https://flagcdn.com/ca.svg', 'CAD', 'America/Edmonton', 51.0447, -114.0719, 4, TRUE
FROM restaurant_locations WHERE slug = 'canada'
ON CONFLICT (slug) DO NOTHING;

-- Malaysia cities
INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Kuala Lumpur', 'kuala_lumpur', 'city', 'KL', id, 'https://flagcdn.com/my.svg', 'MYR', 'Asia/Kuala_Lumpur', 3.1390, 101.6869, 1, TRUE
FROM restaurant_locations WHERE slug = 'malaysia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Penang', 'penang', 'city', 'PG', id, 'https://flagcdn.com/my.svg', 'MYR', 'Asia/Kuala_Lumpur', 5.4164, 100.3327, 2, TRUE
FROM restaurant_locations WHERE slug = 'malaysia'
ON CONFLICT (slug) DO NOTHING;

-- Hong Kong districts
INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Hong Kong Island', 'hong_kong_island', 'city', 'HKI', id, 'https://flagcdn.com/hk.svg', 'HKD', 'Asia/Hong_Kong', 22.2783, 114.1747, 1, TRUE
FROM restaurant_locations WHERE slug = 'hongkong'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Kowloon', 'kowloon', 'city', 'KLN', id, 'https://flagcdn.com/hk.svg', 'HKD', 'Asia/Hong_Kong', 22.3193, 114.1694, 2, TRUE
FROM restaurant_locations WHERE slug = 'hongkong'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'New Territories', 'new_territories', 'city', 'NT', id, 'https://flagcdn.com/hk.svg', 'HKD', 'Asia/Hong_Kong', 22.4350, 114.1095, 3, TRUE
FROM restaurant_locations WHERE slug = 'hongkong'
ON CONFLICT (slug) DO NOTHING;

-- China cities
INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Beijing', 'beijing', 'city', 'BJ', id, 'https://flagcdn.com/cn.svg', 'CNY', 'Asia/Shanghai', 39.9042, 116.4074, 1, TRUE
FROM restaurant_locations WHERE slug = 'china'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Shanghai', 'shanghai', 'city', 'SH', id, 'https://flagcdn.com/cn.svg', 'CNY', 'Asia/Shanghai', 31.2304, 121.4737, 2, TRUE
FROM restaurant_locations WHERE slug = 'china'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Guangzhou', 'guangzhou', 'city', 'GZ', id, 'https://flagcdn.com/cn.svg', 'CNY', 'Asia/Shanghai', 23.1291, 113.2644, 3, TRUE
FROM restaurant_locations WHERE slug = 'china'
ON CONFLICT (slug) DO NOTHING;

-- Philippines cities
INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Manila', 'manila', 'city', 'MNL', id, 'https://flagcdn.com/ph.svg', 'PHP', 'Asia/Manila', 14.5995, 120.9842, 1, TRUE
FROM restaurant_locations WHERE slug = 'philippines'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_locations (name, slug, type, short_label, parent_id, flag_url, currency, timezone, latitude, longitude, display_order, is_active)
SELECT 
  'Cebu', 'cebu', 'city', 'CEB', id, 'https://flagcdn.com/ph.svg', 'PHP', 'Asia/Manila', 10.3157, 123.8854, 2, TRUE
FROM restaurant_locations WHERE slug = 'philippines'
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- 8. Verification Queries
-- ====================================================================

-- View all countries
-- SELECT id, name, slug, type, short_label FROM restaurant_locations WHERE type = 'country' ORDER BY display_order;

-- View all cities with their parent countries
-- SELECT 
--   c.id, 
--   c.name AS city_name, 
--   c.slug AS city_slug,
--   p.name AS country_name,
--   c.latitude,
--   c.longitude
-- FROM restaurant_locations c
-- LEFT JOIN restaurant_locations p ON c.parent_id = p.id
-- WHERE c.type = 'city'
-- ORDER BY p.display_order, c.display_order;

-- View hierarchical structure
-- SELECT 
--   CASE WHEN parent_id IS NULL THEN name ELSE '  ├── ' || name END AS location_hierarchy,
--   type,
--   short_label,
--   CASE 
--     WHEN latitude IS NOT NULL THEN 
--       '(' || ROUND(latitude::numeric, 4) || ', ' || ROUND(longitude::numeric, 4) || ')'
--     ELSE ''
--   END AS coordinates
-- FROM restaurant_locations
-- ORDER BY 
--   COALESCE(parent_id, id),
--   CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
--   display_order;

-- ====================================================================
-- 9. Rollback (if needed)
-- ====================================================================

-- DROP TABLE IF EXISTS restaurant_location_assignments CASCADE;
-- DROP TABLE IF EXISTS restaurant_locations CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ====================================================================
-- End of Schema
-- ====================================================================
