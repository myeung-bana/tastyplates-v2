Absolutely — below is a **Markdown-ready functional PRD** plus **SQL schema / indexes / retrieval examples / refresh strategy**.

I’m grounding this on the current design gap you documented: the main list currently filters and sorts mostly client-side, the selected palate/cuisine is not fully passed into the list API, and global sort is unstable because the page only reorders the rows already loaded . Your current sort modes also depend on separate preference/authentic stats endpoints rather than one server-side search index .

---

```markdown
# Functional PRD — Restaurant Search Rating Index & Server-Side Sort

## 1. Purpose

This feature introduces a server-side restaurant search index that supports:

- fast filtering by city, cuisine, palate, price, and rating
- stable global sorting across pagination
- separate support for:
  - Overall Rating
  - Authentic Rating
  - Search Rating
- scalable recalculation whenever reviews change
- low-latency user experience for homepage, cuisine pages, and filtered restaurant discovery

This feature replaces the current pattern where the main list is fetched in a default server order and then narrowed/sorted mostly on the client after rows are already loaded.

---

## 2. Problem Statement

The current implementation has the following issues:

1. Main restaurant listing uses default server ordering and applies user-facing sorting only on the client.
2. Pagination is unstable because sorting happens only on the rows already loaded.
3. Selected palate/cuisine state is not consistently pushed into the main list API.
4. Authentic and preference stats are fetched separately, which increases complexity and makes ranking harder to reason about.
5. Search logic is not using a single canonical search index.

This creates bugs such as:
- incorrect top-ranked restaurants
- unstable order after infinite scroll
- selected cuisine/palate not affecting candidate retrieval correctly
- inconsistent UX between homepage search, cuisine pages, and sort modes

---

## 3. Product Goals

The system must support the following behavior:

### 3.1 Region / City
- City selected from top navigation is a hard filter.
- Only restaurants in the selected city/region are eligible for the result set.

### 3.2 Cuisine Search
- Selecting a cuisine such as `Japanese` narrows the candidate set to restaurants assigned to that cuisine.
- Smart Sort for a cuisine page must return restaurants in descending Authentic Rating for that cuisine.

### 3.3 Sort Modes
The system must support:

- Smart Sort
  - order by highest Authentic Rating descending
- Highest Rated
  - order by highest Overall Rating descending
- Lowest Rated
  - order by lowest Overall Rating ascending
- Newest
  - order by newest publish/listing date descending
- My Preference
  - order by Search Rating descending

### 3.4 Rating Types
Each restaurant must support:

- Overall Rating
  - all valid reviews for the restaurant
- Authentic Rating
  - valid reviews where reviewer palate / ethnicity aligns with restaurant cuisine identity
- Search Rating
  - contextual rating based on search dimension, typically cuisine or user preference context

---

## 4. Functional Definitions

### 4.1 Overall Rating
Definition:
- aggregate rating across all valid published reviews for a restaurant

Fields:
- overall_review_count
- overall_rating_sum
- overall_rating_avg
- overall_rating_weighted

Usage:
- Highest Rated
- Lowest Rated
- detail page overview
- ranking fallback

### 4.2 Authentic Rating
Definition:
- aggregate rating across reviews considered "authentic" for the restaurant
- authenticity is determined by a rules engine comparing reviewer palate / ethnicity against restaurant cuisine identity

Fields:
- authentic_review_count
- authentic_rating_sum
- authentic_rating_avg
- authentic_rating_weighted

Usage:
- Smart Sort
- cuisine authenticity ranking
- detail page authentic score

### 4.3 Search Rating
Definition:
- contextual rating used for ranking under a search context
- not a single universal restaurant-level field
- usually scoped per cuisine, and optionally per palate or user preference model

Fields:
- search_review_count
- search_rating_sum
- search_rating_avg
- search_rating_weighted

Usage:
- My Preference
- contextual cuisine ranking
- future personalized ranking model

---

## 5. Data Model Strategy

### 5.1 Design Principle
Raw reviews are the source of truth.
Search/rating summary tables are derived and optimized for read performance.

### 5.2 Summary Tables
The implementation will use:

1. `restaurant_rating_summary`
   - one row per restaurant
   - stores Overall and Authentic aggregates

2. `restaurant_cuisine_rating_summary`
   - one row per restaurant per cuisine
   - stores Search and cuisine-scoped Authentic aggregates

3. `restaurant_search_index`
   - flattened search table optimized for filtering and sorting
   - includes city, cuisine, publish state, summary ratings, and timestamps

### 5.3 Initialization
When a restaurant is created:
- create an empty `restaurant_rating_summary` row
- do not default visible ratings to `0`
- use:
  - avg = NULL
  - count = 0
  - weighted score = NULL

Cuisine summary rows may be created lazily when first relevant review appears.

---

## 6. Update / Refresh Logic

### 6.1 Trigger Events
A restaurant summary must be recalculated when:

- a review is created
- a review is updated
- a review is deleted
- a review is unpublished / hidden / moderated
- reviewer palate / ethnicity classification changes
- restaurant cuisine mapping changes
- restaurant palate mapping changes

### 6.2 Refresh Scope
Refresh must be performed per restaurant, not globally.

Example:
- review added to Restaurant A
- only Restaurant A summaries are rebuilt

### 6.3 Rebuild Job
On each trigger:
- enqueue `rebuild_restaurant_rating_summary(restaurant_id)`

Job steps:
1. fetch all valid reviews for the restaurant
2. compute Overall aggregates
3. compute Authentic aggregates
4. group by cuisine and compute Search aggregates
5. upsert summary rows
6. refresh flattened search index row(s)
7. invalidate search cache for affected restaurant

### 6.4 Backfill
When rolling out this feature into an existing system:
- run one-time backfill across all restaurants
- compute summaries from historical review data
- populate search index
- switch search API to use server-side summary tables

---

## 7. User Experience Requirements

### 7.1 Fast Search
The user must experience:
- stable ordering across infinite scroll
- no reordering of already-visible items after page load
- fast sort/filter changes
- low time-to-first-result

### 7.2 Empty Ratings
If a restaurant has no reviews:
- show "No ratings yet"
- do not show numeric `0.0`

### 7.3 Pagination
Pagination must be cursor-based where possible.
Ordering must be aligned to selected sort mode.

Example:
- Highest Rated:
  - cursor on `(overall_rating_weighted desc, restaurant_id desc)`
- Smart Sort:
  - cursor on `(authentic_rating_weighted desc, restaurant_id desc)`
- Newest:
  - cursor on `(published_at desc, restaurant_id desc)`

---

## 8. Performance Requirements

### 8.1 Read Path
Restaurant search requests must not compute review aggregates on the fly.

Search requests must read from:
- `restaurant_search_index`
- `restaurant_rating_summary`
- `restaurant_cuisine_rating_summary`

### 8.2 Write Path
Review submission should be lightweight:
- store review
- enqueue summary rebuild job
- return success quickly

Summary recomputation should happen asynchronously.

### 8.3 Caching
Recommended cache layers:
- Redis cache for search queries by normalized filter key
- cache invalidation by restaurant_id or city+cuisine segment
- short TTL for high-traffic search endpoints

### 8.4 Precomputation
Weighted scores must be precomputed and stored.
Do not sort using raw average only.

Suggested formula:
weighted_score = ((avg_rating * count) + (global_mean * m)) / (count + m)

Where:
- global_mean = platform average
- m = minimum confidence threshold, e.g. 5 or 10

---

## 9. API Requirements

### 9.1 Search Endpoint
`GET /api/v1/restaurants/search`

Supported params:
- city_id
- cuisine_ids[]
- palate_ids[]
- price_range_id
- min_rating
- max_rating
- search
- sort_mode
- cursor
- limit

### 9.2 Sort Modes
Accepted values:
- SMART
- HIGHEST_RATED
- LOWEST_RATED
- NEWEST
- MY_PREFERENCE

### 9.3 Sort Mapping
- SMART -> authentic_rating_weighted desc
- HIGHEST_RATED -> overall_rating_weighted desc
- LOWEST_RATED -> overall_rating_weighted asc
- NEWEST -> published_at desc
- MY_PREFERENCE -> search_rating_weighted desc

### 9.4 Response Fields
Each restaurant result should include:
- restaurant_id
- title
- city_id
- cuisine_ids
- overall_rating_avg
- overall_rating_count
- authentic_rating_avg
- authentic_rating_count
- search_rating_avg (if search context exists)
- search_rating_count (if search context exists)
- published_at
- primary_sort_score
- primary_sort_label

---

## 10. Non-Functional Requirements

- summary rebuild must be idempotent
- search results must be deterministic
- sort must remain stable across pagination
- search logic must work even if some summary values are NULL
- unrated restaurants should sort below rated restaurants for rating-driven sort modes

---

## 11. Acceptance Criteria

### AC-1
If a user selects city = Kuala Lumpur and cuisine = Japanese and sort = SMART,
then only Kuala Lumpur Japanese restaurants are returned,
ordered by Authentic Rating descending.

### AC-2
If a user selects Highest Rated,
results are ordered by Overall Rating descending across the full dataset,
not just the currently loaded client rows.

### AC-3
If a restaurant receives a new review,
its search summaries refresh without recalculating unrelated restaurants.

### AC-4
If a restaurant has no reviews,
UI shows "No ratings yet" and does not display `0.0`.

### AC-5
Changing sort mode does not cause unstable reordering caused by client-side re-sort of partially loaded pages.

### AC-6
Search results are fast enough for seamless UX because rating aggregates are precomputed and indexed.

---
```

## SQL schema and retrieval

Below is a PostgreSQL-flavored version. It is intentionally practical rather than hyper-abstract.

### 1) Restaurant-level summary table

```sql
CREATE TABLE IF NOT EXISTS restaurant_rating_summary (
    restaurant_id              BIGINT PRIMARY KEY,
    overall_review_count       INTEGER NOT NULL DEFAULT 0,
    overall_rating_sum         NUMERIC(12,4) NOT NULL DEFAULT 0,
    overall_rating_avg         NUMERIC(6,3) NULL,
    overall_rating_weighted    NUMERIC(6,3) NULL,

    authentic_review_count     INTEGER NOT NULL DEFAULT 0,
    authentic_rating_sum       NUMERIC(12,4) NOT NULL DEFAULT 0,
    authentic_rating_avg       NUMERIC(6,3) NULL,
    authentic_rating_weighted  NUMERIC(6,3) NULL,

    review_version             BIGINT NOT NULL DEFAULT 0,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2) Restaurant x cuisine summary table

This is where contextual `Search Rating` lives.

```sql
CREATE TABLE IF NOT EXISTS restaurant_cuisine_rating_summary (
    restaurant_id              BIGINT NOT NULL,
    cuisine_id                 BIGINT NOT NULL,

    search_review_count        INTEGER NOT NULL DEFAULT 0,
    search_rating_sum          NUMERIC(12,4) NOT NULL DEFAULT 0,
    search_rating_avg          NUMERIC(6,3) NULL,
    search_rating_weighted     NUMERIC(6,3) NULL,

    authentic_review_count     INTEGER NOT NULL DEFAULT 0,
    authentic_rating_sum       NUMERIC(12,4) NOT NULL DEFAULT 0,
    authentic_rating_avg       NUMERIC(6,3) NULL,
    authentic_rating_weighted  NUMERIC(6,3) NULL,

    review_version             BIGINT NOT NULL DEFAULT 0,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (restaurant_id, cuisine_id)
);
```

### 3) Flattened search index table

This is the fast read layer for search.

```sql
CREATE TABLE IF NOT EXISTS restaurant_search_index (
    restaurant_id              BIGINT PRIMARY KEY,
    city_id                    BIGINT NOT NULL,
    status                     TEXT NOT NULL,
    title                      TEXT NOT NULL,
    slug                       TEXT NOT NULL,
    search_text                TEXT NULL,

    price_range_id             BIGINT NULL,
    published_at               TIMESTAMPTZ NULL,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    overall_rating_avg         NUMERIC(6,3) NULL,
    overall_rating_count       INTEGER NOT NULL DEFAULT 0,
    overall_rating_weighted    NUMERIC(6,3) NULL,

    authentic_rating_avg       NUMERIC(6,3) NULL,
    authentic_rating_count     INTEGER NOT NULL DEFAULT 0,
    authentic_rating_weighted  NUMERIC(6,3) NULL,

    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4) Restaurant to cuisine mapping

If you do not already have one:

```sql
CREATE TABLE IF NOT EXISTS restaurant_cuisines (
    restaurant_id              BIGINT NOT NULL,
    cuisine_id                 BIGINT NOT NULL,
    PRIMARY KEY (restaurant_id, cuisine_id)
);
```

### 5) Helpful indexes

These matter a lot for fast search.

```sql
CREATE INDEX IF NOT EXISTS idx_rsi_city_status
    ON restaurant_search_index (city_id, status);

CREATE INDEX IF NOT EXISTS idx_rsi_newest
    ON restaurant_search_index (city_id, status, published_at DESC, restaurant_id DESC);

CREATE INDEX IF NOT EXISTS idx_rsi_highest_rated
    ON restaurant_search_index (city_id, status, overall_rating_weighted DESC, restaurant_id DESC);

CREATE INDEX IF NOT EXISTS idx_rsi_lowest_rated
    ON restaurant_search_index (city_id, status, overall_rating_weighted ASC, restaurant_id ASC);

CREATE INDEX IF NOT EXISTS idx_rsi_smart
    ON restaurant_search_index (city_id, status, authentic_rating_weighted DESC, restaurant_id DESC);

CREATE INDEX IF NOT EXISTS idx_rcs_cuisine_search
    ON restaurant_cuisine_rating_summary (cuisine_id, search_rating_weighted DESC, restaurant_id DESC);

CREATE INDEX IF NOT EXISTS idx_rcs_cuisine_auth
    ON restaurant_cuisine_rating_summary (cuisine_id, authentic_rating_weighted DESC, restaurant_id DESC);

CREATE INDEX IF NOT EXISTS idx_restaurant_cuisines_cuisine
    ON restaurant_cuisines (cuisine_id, restaurant_id);
```

### 6) Weighted score helper formula

A handy formula for smoothing low-count ratings:

```sql
-- weighted_score = ((avg_rating * count) + (global_mean * m)) / (count + m)
```

Example constants:

* `global_mean = 4.0`
* `m = 5`

### 7) Rebuild one restaurant summary

This is usually better done in application code or a worker, but here’s the SQL pattern.

Assumptions:

* `restaurant_reviews` contains `restaurant_id`, `rating`, `status`, `is_authentic`, `cuisine_id`
* valid review status is `published`

#### Rebuild restaurant-level summary

```sql
INSERT INTO restaurant_rating_summary (
    restaurant_id,
    overall_review_count,
    overall_rating_sum,
    overall_rating_avg,
    overall_rating_weighted,
    authentic_review_count,
    authentic_rating_sum,
    authentic_rating_avg,
    authentic_rating_weighted,
    review_version,
    updated_at
)
SELECT
    r.restaurant_id,
    COUNT(*) FILTER (WHERE r.status = 'published') AS overall_review_count,
    COALESCE(SUM(r.rating) FILTER (WHERE r.status = 'published'), 0) AS overall_rating_sum,
    AVG(r.rating) FILTER (WHERE r.status = 'published') AS overall_rating_avg,
    CASE
        WHEN COUNT(*) FILTER (WHERE r.status = 'published') = 0 THEN NULL
        ELSE (
            (
                AVG(r.rating) FILTER (WHERE r.status = 'published')
                * COUNT(*) FILTER (WHERE r.status = 'published')
            ) + (4.0 * 5)
        ) / (COUNT(*) FILTER (WHERE r.status = 'published') + 5)
    END AS overall_rating_weighted,

    COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) AS authentic_review_count,
    COALESCE(SUM(r.rating) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE), 0) AS authentic_rating_sum,
    AVG(r.rating) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) AS authentic_rating_avg,
    CASE
        WHEN COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) = 0 THEN NULL
        ELSE (
            (
                AVG(r.rating) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE)
                * COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE)
            ) + (4.0 * 5)
        ) / (COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) + 5)
    END AS authentic_rating_weighted,

    EXTRACT(EPOCH FROM NOW())::BIGINT AS review_version,
    NOW()
FROM restaurant_reviews r
WHERE r.restaurant_id = $1
GROUP BY r.restaurant_id
ON CONFLICT (restaurant_id)
DO UPDATE SET
    overall_review_count = EXCLUDED.overall_review_count,
    overall_rating_sum = EXCLUDED.overall_rating_sum,
    overall_rating_avg = EXCLUDED.overall_rating_avg,
    overall_rating_weighted = EXCLUDED.overall_rating_weighted,
    authentic_review_count = EXCLUDED.authentic_review_count,
    authentic_rating_sum = EXCLUDED.authentic_rating_sum,
    authentic_rating_avg = EXCLUDED.authentic_rating_avg,
    authentic_rating_weighted = EXCLUDED.authentic_rating_weighted,
    review_version = EXCLUDED.review_version,
    updated_at = NOW();
```

#### Rebuild restaurant x cuisine summary

```sql
INSERT INTO restaurant_cuisine_rating_summary (
    restaurant_id,
    cuisine_id,
    search_review_count,
    search_rating_sum,
    search_rating_avg,
    search_rating_weighted,
    authentic_review_count,
    authentic_rating_sum,
    authentic_rating_avg,
    authentic_rating_weighted,
    review_version,
    updated_at
)
SELECT
    r.restaurant_id,
    r.cuisine_id,

    COUNT(*) FILTER (WHERE r.status = 'published') AS search_review_count,
    COALESCE(SUM(r.rating) FILTER (WHERE r.status = 'published'), 0) AS search_rating_sum,
    AVG(r.rating) FILTER (WHERE r.status = 'published') AS search_rating_avg,
    CASE
        WHEN COUNT(*) FILTER (WHERE r.status = 'published') = 0 THEN NULL
        ELSE (
            (
                AVG(r.rating) FILTER (WHERE r.status = 'published')
                * COUNT(*) FILTER (WHERE r.status = 'published')
            ) + (4.0 * 5)
        ) / (COUNT(*) FILTER (WHERE r.status = 'published') + 5)
    END AS search_rating_weighted,

    COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) AS authentic_review_count,
    COALESCE(SUM(r.rating) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE), 0) AS authentic_rating_sum,
    AVG(r.rating) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) AS authentic_rating_avg,
    CASE
        WHEN COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) = 0 THEN NULL
        ELSE (
            (
                AVG(r.rating) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE)
                * COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE)
            ) + (4.0 * 5)
        ) / (COUNT(*) FILTER (WHERE r.status = 'published' AND r.is_authentic = TRUE) + 5)
    END AS authentic_rating_weighted,

    EXTRACT(EPOCH FROM NOW())::BIGINT AS review_version,
    NOW()
FROM restaurant_reviews r
WHERE r.restaurant_id = $1
  AND r.cuisine_id IS NOT NULL
GROUP BY r.restaurant_id, r.cuisine_id
ON CONFLICT (restaurant_id, cuisine_id)
DO UPDATE SET
    search_review_count = EXCLUDED.search_review_count,
    search_rating_sum = EXCLUDED.search_rating_sum,
    search_rating_avg = EXCLUDED.search_rating_avg,
    search_rating_weighted = EXCLUDED.search_rating_weighted,
    authentic_review_count = EXCLUDED.authentic_review_count,
    authentic_rating_sum = EXCLUDED.authentic_rating_sum,
    authentic_rating_avg = EXCLUDED.authentic_rating_avg,
    authentic_rating_weighted = EXCLUDED.authentic_rating_weighted,
    review_version = EXCLUDED.review_version,
    updated_at = NOW();
```

### 8) Refresh flattened search index

```sql
INSERT INTO restaurant_search_index (
    restaurant_id,
    city_id,
    status,
    title,
    slug,
    search_text,
    price_range_id,
    published_at,
    created_at,
    overall_rating_avg,
    overall_rating_count,
    overall_rating_weighted,
    authentic_rating_avg,
    authentic_rating_count,
    authentic_rating_weighted,
    updated_at
)
SELECT
    r.id AS restaurant_id,
    r.city_id,
    r.status,
    r.title,
    r.slug,
    CONCAT_WS(' ', r.title, r.slug, r.listing_street) AS search_text,
    r.price_range_id,
    r.published_at,
    r.created_at,
    s.overall_rating_avg,
    s.overall_review_count,
    s.overall_rating_weighted,
    s.authentic_rating_avg,
    s.authentic_review_count,
    s.authentic_rating_weighted,
    NOW()
FROM restaurants r
LEFT JOIN restaurant_rating_summary s
    ON s.restaurant_id = r.id
WHERE r.id = $1
ON CONFLICT (restaurant_id)
DO UPDATE SET
    city_id = EXCLUDED.city_id,
    status = EXCLUDED.status,
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    search_text = EXCLUDED.search_text,
    price_range_id = EXCLUDED.price_range_id,
    published_at = EXCLUDED.published_at,
    created_at = EXCLUDED.created_at,
    overall_rating_avg = EXCLUDED.overall_rating_avg,
    overall_rating_count = EXCLUDED.overall_rating_count,
    overall_rating_weighted = EXCLUDED.overall_rating_weighted,
    authentic_rating_avg = EXCLUDED.authentic_rating_avg,
    authentic_rating_count = EXCLUDED.authentic_rating_count,
    authentic_rating_weighted = EXCLUDED.authentic_rating_weighted,
    updated_at = NOW();
```

---

## Search retrieval examples

### A) Smart Sort within city + cuisine

This is the query you want for:

* city = KL
* cuisine = Japanese
* sort = Smart Sort

```sql
SELECT
    i.restaurant_id,
    i.title,
    i.slug,
    i.city_id,
    i.published_at,
    c.authentic_rating_avg,
    c.authentic_review_count,
    c.authentic_rating_weighted
FROM restaurant_search_index i
JOIN restaurant_cuisines rc
    ON rc.restaurant_id = i.restaurant_id
JOIN restaurant_cuisine_rating_summary c
    ON c.restaurant_id = i.restaurant_id
   AND c.cuisine_id = rc.cuisine_id
WHERE i.status = 'publish'
  AND i.city_id = $1
  AND rc.cuisine_id = $2
ORDER BY
    c.authentic_rating_weighted DESC NULLS LAST,
    c.authentic_review_count DESC,
    i.restaurant_id DESC
LIMIT $3;
```

### B) Highest Rated within city + cuisine

```sql
SELECT
    i.restaurant_id,
    i.title,
    i.slug,
    i.overall_rating_avg,
    i.overall_rating_count,
    i.overall_rating_weighted
FROM restaurant_search_index i
JOIN restaurant_cuisines rc
    ON rc.restaurant_id = i.restaurant_id
WHERE i.status = 'publish'
  AND i.city_id = $1
  AND rc.cuisine_id = $2
ORDER BY
    i.overall_rating_weighted DESC NULLS LAST,
    i.overall_rating_count DESC,
    i.restaurant_id DESC
LIMIT $3;
```

### C) Lowest Rated within city + cuisine

```sql
SELECT
    i.restaurant_id,
    i.title,
    i.slug,
    i.overall_rating_avg,
    i.overall_rating_count,
    i.overall_rating_weighted
FROM restaurant_search_index i
JOIN restaurant_cuisines rc
    ON rc.restaurant_id = i.restaurant_id
WHERE i.status = 'publish'
  AND i.city_id = $1
  AND rc.cuisine_id = $2
ORDER BY
    i.overall_rating_weighted ASC NULLS LAST,
    i.overall_rating_count DESC,
    i.restaurant_id ASC
LIMIT $3;
```

### D) Newest within city + cuisine

```sql
SELECT
    i.restaurant_id,
    i.title,
    i.slug,
    i.published_at
FROM restaurant_search_index i
JOIN restaurant_cuisines rc
    ON rc.restaurant_id = i.restaurant_id
WHERE i.status = 'publish'
  AND i.city_id = $1
  AND rc.cuisine_id = $2
ORDER BY
    i.published_at DESC NULLS LAST,
    i.restaurant_id DESC
LIMIT $3;
```

### E) My Preference using Search Rating per cuisine

```sql
SELECT
    i.restaurant_id,
    i.title,
    i.slug,
    c.search_rating_avg,
    c.search_review_count,
    c.search_rating_weighted
FROM restaurant_search_index i
JOIN restaurant_cuisines rc
    ON rc.restaurant_id = i.restaurant_id
JOIN restaurant_cuisine_rating_summary c
    ON c.restaurant_id = i.restaurant_id
   AND c.cuisine_id = rc.cuisine_id
WHERE i.status = 'publish'
  AND i.city_id = $1
  AND rc.cuisine_id = $2
ORDER BY
    c.search_rating_weighted DESC NULLS LAST,
    c.search_review_count DESC,
    i.restaurant_id DESC
LIMIT $3;
```

---

## Fast calculation + seamless UX method

This is the part that will make the user experience feel modern instead of laggy.

### 1) Do not compute search ratings during page load

Search endpoints should only read from summary/index tables.

Bad:

* load restaurants
* fetch reviews
* compute authentic score in app
* sort client-side

Good:

* read one indexed query
* return already-ranked results

That directly addresses the current issue where visible-grid sorting happens client-side after fetch .

### 2) Use async summary rebuild jobs

When a review is created/updated/deleted:

1. save review
2. enqueue `rebuild_restaurant_summary(restaurant_id)`
3. worker recomputes summary tables
4. update search index
5. invalidate related cache keys

This keeps write latency low.

### 3) Cache query results by normalized key

Example cache key:

```text
restaurants:search:v3:city=12:cuisine=9:sort=SMART:price=2:min=4:cursor=abc123
```

Use short TTL for hot queries, like 30–120 seconds, plus targeted invalidation when a restaurant in that segment changes.

### 4) Keep pagination server-side

Do not fetch a generic page and then reorder locally.
Instead, query the exact order on the server and paginate by that same order.

### 5) Precompute weighted scores

Never sort using just raw average.
Weighted scores avoid silly ranking jumps from 1-review restaurants.

### 6) Use denormalized search index for list cards

The list endpoint should not need to join 8 tables for every request.
The more you can flatten into `restaurant_search_index`, the faster the first paint feels.

### 7) Lazy hydrate detail-only data

For list pages, return only what the cards need:

* title
* slug
* hero image
* city
* price
* overall/authentic/search scores
* sort score
* publish timestamp

Do not load full detail-page payload in list results.

### 8) Invalidate surgically

If Restaurant A changes:

* rebuild Restaurant A summaries
* refresh Restaurant A search index row
* invalidate caches for:

  * its city
  * its cuisine pages
  * relevant search keys

Not the entire restaurant cache universe.

---

## Recommended rollout order

1. Create summary tables.
2. Backfill existing restaurant review summaries.
3. Build worker/job for per-restaurant rebuild.
4. Build flattened `restaurant_search_index`.
5. Replace client-side sort with server-side `sort_mode`.
6. Add cursor pagination aligned to sort mode.
7. Keep Redis cache as final acceleration layer.

---

## Practical default behavior

Use these defaults:

* no reviews:

  * `avg = NULL`
  * `count = 0`
  * UI shows `No ratings yet`
* default sort:

  * `SMART`
* tie-breakers:

  * count desc
  * overall rating desc
  * restaurant_id desc
* city:

  * hard filter
* cuisine:

  * hard filter
* search rating:

  * contextual, stored per restaurant x cuisine

---

If you want, next I can turn this into a **Hasura-ready SQL migration pack** or a **GraphQL query + API contract spec** that matches your existing `get-restaurants` flow.
