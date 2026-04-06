-- =============================================================================
-- Featured restaurants (homepage curated strip)
-- =============================================================================
-- Global editorial picks: one row per restaurant, ordered by sort_order.
-- =============================================================================

CREATE TABLE IF NOT EXISTS featured_restaurants (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants (id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_featured_restaurants_active_sort
  ON featured_restaurants (sort_order)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_featured_restaurants_restaurant
  ON featured_restaurants (restaurant_id);

COMMENT ON TABLE featured_restaurants IS
  'Editorial restaurant picks for homepage (global list).';
