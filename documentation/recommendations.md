# Recommended restaurants (Explore)

This document describes the database shape for **curated “recommended restaurants”** lists on the **Explore** (`/restaurants`) experience. It ties each recommendation to a **city** so the frontend can show the right picks for the user’s selected location (`LocationContext` / `selectedLocation.key`).

---

## Goals

- Maintain **named lists** (e.g. a single list for “Explore recommended”) that editors can extend without code changes.
- Associate **many restaurants** to a list, with **one city scope per row** (same restaurant can appear for Toronto and again for Hong Kong as separate rows).
- Let the app **filter by city** using the same taxonomy as the rest of the product (`restaurant_locations`), not by parsing `address` JSON on every request (though you can still cross-check the restaurant’s real address in app logic if needed).

---

## Tables

### `recommended_restaurant_lists`

| Column          | Type         | Notes |
|----------------|--------------|--------|
| `id`           | `serial`     | Primary key. |
| `slug`         | `varchar(100)` | Stable key for code and APIs, e.g. `explore_recommended`. **Unique.** |
| `title`        | `varchar(255)` | Human-readable title shown in admin or debug UI. |
| `description`  | `text`       | Optional. |
| `is_active`    | `boolean`    | Soft-disable a list without deleting items. |
| `display_order`| `int`        | Sort lists if you add more than one on a page. |
| `created_at` / `updated_at` | `timestamptz` | Audit. |

### `recommended_restaurant_list_items`

| Column               | Type     | Notes |
|---------------------|----------|--------|
| `id`                | `serial` | Primary key. |
| `list_id`           | `int`    | FK → `recommended_restaurant_lists.id` (cascade delete). |
| `restaurant_id`     | `int`    | FK → `restaurants.id` (cascade delete). |
| `city_location_id`  | `int`    | FK → `restaurant_locations.id`. **Must be the city row** (see below). |
| `sort_order`        | `int`    | Lower = earlier in the carousel/section. |
| `created_at`        | `timestamptz` | Optional audit. |

**Unique constraint:** `(list_id, restaurant_id, city_location_id)` so you cannot duplicate the same triple.

**Indexes:** See migration `database/migrations/recommended_restaurants_schema.sql` for list+city+sort and restaurant lookups.

---

## City scoping

- Cities live in **`restaurant_locations`** with `type = 'city'` (see `database/migrations/location_taxonomy_schema.sql`).
- Each **item row** is valid for **one** city: `city_location_id` points at that city’s `restaurant_locations.id`.
- **Frontend rule:** resolve the user’s selected city key (e.g. `toronto`) to a **`restaurant_locations` row** (match `slug` to `selectedLocation.key`), then query items where `city_location_id = <that id>` (and `list.slug = 'explore_recommended'` or whatever you configure).

If a restaurant should appear in three cities, insert **three rows** (same `list_id` and `restaurant_id`, different `city_location_id`).

---

## SQL migration

The canonical DDL lives in:

`database/migrations/recommended_restaurants_schema.sql`

Run it against your Postgres database (after `restaurants` and `restaurant_locations` exist). Adjust owner/permissions to match your environment.

### Example seed (illustrative)

Replace `1`, `2`, `42` with real IDs from your DB:

```sql
INSERT INTO recommended_restaurant_lists (slug, title, is_active, display_order)
VALUES ('explore_recommended', 'Recommended for you', true, 0)
ON CONFLICT (slug) DO NOTHING;

-- Suppose list id = 1, Toronto city_location_id = 2, restaurant ids 10 and 11
INSERT INTO recommended_restaurant_list_items (list_id, restaurant_id, city_location_id, sort_order)
VALUES
  (1, 10, 2, 0),
  (1, 11, 2, 1);
```

---

## Hasura

After creating the tables:

1. **Track** `recommended_restaurant_lists` and `recommended_restaurant_list_items` in the Hasura console.
2. Add **relationships**:
   - `recommended_restaurant_list_items` → `restaurants` (by `restaurant_id`).
   - `recommended_restaurant_list_items` → `restaurant_locations` (by `city_location_id`).
   - `recommended_restaurant_lists` → `recommended_restaurant_list_items` (array, by `list_id`).
3. Set **permissions** (e.g. anonymous / user **select** on active lists only; **insert/update/delete** for admin role only).

Optional **view** for a single query shape:

```sql
CREATE OR REPLACE VIEW recommended_restaurants_explore AS
SELECT
  li.id AS item_id,
  l.slug AS list_slug,
  li.sort_order,
  li.restaurant_id,
  loc.slug AS city_slug,
  loc.id AS city_location_id
FROM recommended_restaurant_list_items li
JOIN recommended_restaurant_lists l ON l.id = li.list_id AND l.is_active = TRUE
JOIN restaurant_locations loc ON loc.id = li.city_location_id AND loc.type = 'city';
```

Track the view in Hasura if you prefer one endpoint for the Explore page.

---

## Frontend (Explore / restaurants page)

1. Read **`selectedLocation.key`** from `LocationContext` (same as filters and articles).
2. Resolve **`city_location_id`** (GraphQL: `restaurant_locations` where `slug = selectedLocation.key` and `type = city`, or use cached data from `useLocations`).
3. Fetch **`recommended_restaurant_list_items`** (or the view) where:
   - `list.slug = 'explore_recommended'` (or your chosen slug), and
   - `city_location_id` matches the resolved city.
4. **Order by** `sort_order` ascending.
5. Join or batch-fetch **`restaurants`** for cards (reuse existing restaurant card components and transformers).

If no rows exist for that city, hide the section or show a fallback message—purely product choice.

---

## Operational notes

- **Integrity:** Prefer enforcing “city row only” for `city_location_id` in application or admin UI; optional DB trigger can check `restaurant_locations.type = 'city'` on insert/update.
- **Branches:** If you use `branch_group_id` / multiple locations per restaurant, still pick one **`restaurants.id`** per recommendation row (the location you want featured).
- **Caching:** List slugs and city slugs are stable; cache per `(list_slug, city_slug)` on the client or CDN if needed.

---

## Document history

| Version | Change |
|---------|--------|
| 1.0     | Initial schema and Explore integration notes. |
