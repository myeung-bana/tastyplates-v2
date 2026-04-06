-- =============================================================================
-- Recommended restaurants (curated lists scoped by city)
-- =============================================================================
-- Use with: restaurant_locations (city rows) + restaurants
-- Frontend: filter items WHERE city_location_id matches user's selected city,
--           or join on restaurant_locations.slug = LocationContext selectedLocation.key
-- =============================================================================

CREATE TABLE IF NOT EXISTS recommended_restaurant_lists (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommended_restaurant_list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES recommended_restaurant_lists (id) ON DELETE CASCADE,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
  -- City this row applies to (must reference a row in restaurant_locations with type = 'city')
  city_location_id INTEGER NOT NULL REFERENCES restaurant_locations (id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, restaurant_id, city_location_id)
);

CREATE INDEX IF NOT EXISTS idx_rr_list_items_list_city
  ON recommended_restaurant_list_items (list_id, city_location_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_rr_list_items_restaurant
  ON recommended_restaurant_list_items (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_rr_lists_active_order
  ON recommended_restaurant_lists (is_active, display_order);

COMMENT ON TABLE recommended_restaurant_lists IS
  'Named curated lists (e.g. explore_recommended) for editorial picks.';

COMMENT ON TABLE recommended_restaurant_list_items IS
  'Restaurant membership in a list, scoped to one city (restaurant_locations id, type=city).';

COMMENT ON COLUMN recommended_restaurant_list_items.city_location_id IS
  'FK to restaurant_locations; use the city row so the Explore page can filter by user city.';
