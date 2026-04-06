# Curated restaurants: Explore recommendations & homepage featured

This document covers two related features:

1. **Recommended restaurants (Explore)** — named lists on **`/restaurants`** (e.g. "Recommended for you").
2. **Featured restaurants (Homepage)** — a **global** strip of hand-picked restaurants on the **homepage** (one ordered list for all visitors).

Explore recommendations remain **city-scoped** via `restaurant_locations`. Featured restaurants do not use a `city_location_id` column; curate a single list and rely on restaurant data (e.g. address) for context if needed.

---

## Featured restaurants (Homepage)

### Goals

- Show a **"Featured restaurants"** section on the **homepage**.
- Maintain one **global** ordered list (same picks for all users, unless you add client-side filtering later).
- Support **ordering** (`sort_order`) and **soft-disable** (`is_active`) without deleting rows.

### Table: `featured_restaurants`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `serial` | Primary key. |
| `restaurant_id` | `int` | FK → `restaurants.id` (cascade delete). |
| `sort_order` | `int` | Lower = earlier in the section. |
| `is_active` | `boolean` | Hide a row without removing it. |
| `created_at` / `updated_at` | `timestamptz` | Audit. |

**Unique constraint:** `(restaurant_id)` — each restaurant appears at most once in the featured list.

**Indexes:** Partial index on `(sort_order)` where `is_active = true` for fast homepage queries.

### SQL migration

Canonical DDL:

`database/migrations/featured_restaurants_schema.sql`

Run it after `restaurants` exists.

### Example seed (illustrative)

```sql
INSERT INTO featured_restaurants (restaurant_id, sort_order, is_active)
VALUES
  (10, 0, true),
  (11, 1, true),
  (12, 2, true);
```

### Hasura

1. **Track** `featured_restaurants`.
2. **Relationships:**
   - → `restaurants` (`restaurant_id`)
3. **Permissions:** anonymous / user **select** where `is_active = true` (optional row filter); **insert/update/delete** for admin.

Optional **view**:

```sql
CREATE OR REPLACE VIEW featured_restaurants_homepage AS
SELECT
  f.id AS featured_id,
  f.sort_order,
  f.restaurant_id
FROM featured_restaurants f
WHERE f.is_active = TRUE;
```

### Frontend (homepage)

1. Call **`GET /api/v1/featured-restaurants`** (or GraphQL: `featured_restaurants` where `is_active = true`, `order_by: sort_order asc`).
2. Join **`restaurants`** for title, image, address on each card.

If no rows exist, **hide the section** or show a fallback—product choice.

### How this differs from Explore recommendations

| | Explore (`recommended_restaurant_*`) | Homepage (`featured_restaurants`) |
|---|--------------------------------------|-----------------------------------|
| **Purpose** | Named lists (slug per list), e.g. `explore_recommended` | Homepage featured strip |
| **Tables** | `recommended_restaurant_lists` + `recommended_restaurant_list_items` | Single table `featured_restaurants` |
| **City scope** | Per item via `city_location_id` | **Global** list (no city column) |

You *could* model homepage featured rows as a dedicated list slug on `recommended_restaurant_lists` instead; this project keeps **homepage** in **`featured_restaurants`** for a smaller schema and clear naming in code and admin.

---

## Recommended restaurants (Explore)

This section describes the database shape for **curated "recommended restaurants"** lists on the **Explore** (`/restaurants`) experience.

---

## Goals

- Maintain **named lists** (e.g. a single list for "Explore recommended") that editors can extend without code changes.
- Associate **many restaurants** to a list, with **one city scope per row** (same restaurant can appear for Toronto and again for Hong Kong as separate rows).
- Let the app **filter by city** using the same taxonomy as the rest of the product (`restaurant_locations`), not by parsing `address` JSON on every request (though you can still cross-check the restaurant's real address in app logic if needed).

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
- Each **item row** is valid for **one** city: `city_location_id` points at that city's `restaurant_locations.id`.
- **Frontend rule:** resolve the user's selected city key (e.g. `toronto`) to a **`restaurant_locations` row** (match `slug` to `selectedLocation.key`), then query items where `city_location_id = <that id>` (and `list.slug = 'explore_recommended'` or whatever you configure).

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

- **Integrity:** Prefer enforcing "city row only" for `city_location_id` in application or admin UI; optional DB trigger can check `restaurant_locations.type = 'city'` on insert/update (applies to both **recommended** and **featured** tables).
- **Branches:** If you use `branch_group_id` / multiple locations per restaurant, still pick one **`restaurants.id`** per row (the location you want surfaced).
- **Caching:** List slugs and city slugs are stable; cache per `(list_slug, city_slug)` on the client or CDN if needed.

---

## Document history

| Version | Change |
|---------|--------|
| 1.0     | Initial schema and Explore integration notes. |
| 1.1     | Added **Featured restaurants (Homepage)** (`featured_restaurants`), migration `featured_restaurants_schema.sql`, and comparison with Explore lists. |
| 1.2     | Removed `section_key` from `featured_restaurants` — single-purpose homepage table. |
| 1.3     | Removed `city_location_id` from `featured_restaurants` — global featured list. |
