Yep — based on what you want, the fix is actually pretty clean conceptually:

your search page needs to become a **two-step system**:

1. **candidate selection** = “which restaurants belong in this result set?”
2. **ranking** = “in what order should those restaurants appear?”

Right now your implementation is blending the two, and that’s why the behavior feels buggy. The doc confirms that the main page currently does most narrowing and ordering client-side, while the server still returns a default list, usually `created_at desc`  . It also confirms that selected palate/cuisine state exists in the UI, but the main grid is not truly narrowed by selected palate slugs or palate IDs today  .

So here’s the practical fix I’d propose.

---

# 1. Define the intended product logic clearly

Based on your goals, I’d define the search behavior like this:

## A. Top-nav location selector = hard region filter

When the user selects a city, that city becomes the **search region**.
Only restaurants in that city/region should be included in the result set.

This matches your requirement:

* city determines the region I am looking at
* not just a soft suggestion
* not just a local re-ranker

This is important because right now location context is being applied client-side as a threshold filter after loading rows . That is too late in the pipeline.

---

## B. Homepage cuisine selection = hard category constraint

When the user selects `Japanese`, the candidate set should become:

* restaurants in selected city
* restaurants tagged with Japanese cuisine

Then inside that set:

* Smart/Authenic mode sorts by highest authentic score descending

This is the key distinction:
**cuisine selection is not just a scoring hint. It is part of search intent.**

If someone selects Japanese and still sees non-Japanese restaurants because the page only sorts them differently, that’s going to feel broken.

---

## C. Each sort mode should rank the same candidate set differently

Once the candidate set is built, sort it as follows:

### Smart Sort

Highest `authentic_score` desc

### Highest Rated

Highest `overall_rating` desc

### Lowest Rated

Lowest `overall_rating` asc

### Newest

Newest `published_at / created_at` desc

### My Preference

Highest `search_score` desc

That means the **filters define the pool**, and **sort mode defines the order**.

That is the cleanest model.

---

# 2. Proposed fixed search architecture

Here’s the structure I’d move to.

## Step 1: build filters on the server

Your API should receive all relevant filters:

* `city_id` or `region_id`
* `cuisine_ids`
* `palate_ids` if applicable
* `price_range_id`
* `min_rating`
* `search`
* `sort_mode`
* pagination cursor

Your doc already says the route supports things like `cuisine_ids`, `palate_ids`, `price_range_id`, `min_rating`, and geo params, but the main page does not pass them properly today . So this is more of an integration fix than a totally new invention.

---

## Step 2: server returns already-filtered candidates

The backend should return only the restaurants that actually satisfy the chosen filters.

For example, if:

* city = KL
* cuisine = Japanese

Then the API should only return KL Japanese restaurants.

Not:

* all restaurants loaded by newest first
* then filtered/sorted in the browser afterward

---

## Step 3: server applies the selected sort mode

This is the biggest practical fix.

Your doc explicitly says user-facing sort is not delegated to the API today, and client sort only reorders the loaded window  . That is the source of instability.

You want instead:

* `sort_mode=SMART` → order by authentic score desc
* `sort_mode=DESC` → order by rating desc
* `sort_mode=ASC` → order by rating asc
* `sort_mode=NEWEST` → order by publish/create time desc
* `sort_mode=MY_PREFERENCE` → order by search score desc

This makes infinite scroll stable and globally correct.

---

# 3. Recommended behavior for each control

## Location selector

Make this a **hard filter**.

### Current issue

Right now location is applied client-side using `applyLocationFilter(...)`, which means you may already have fetched restaurants outside the intended city and then trim them late .

### Fix

Push this into the API query.

Example:

* `city_id=tokyo`
* or `region_slug=kl-central`

### Why

This ensures:

* pagination is correct
* counts are correct
* sorting is correct within city
* user sees only the region they picked

---

## Cuisine selector

Make this a **hard cuisine filter**, not just a display-state value.

### Current issue

The doc says the cuisine route filters by `listingCategories`, but filter UI values are not consistently passed into the list API for the main page .

### Fix

When the user selects cuisine:

* map cuisine slug/name to `cuisine_id`
* pass it to `get-restaurants`
* backend returns only restaurants with that cuisine

### Example

User selects:

* city = Kuala Lumpur
* cuisine = Japanese
* sort = Smart Sort

Result:

* API filters to KL + Japanese
* API sorts by `authentic_score desc`

That’s exactly the behavior you described.

---

## Palate selector

This depends on your product meaning, but I’d recommend:

### Use palate as a ranking signal for My Preference

not as the primary homepage cuisine constraint.

Why:

* cuisine = category intent
* palate = taste intent

Those are related but not identical.

So:

* cuisine search answers “what type of food am I looking for?”
* My Preference answers “what type of places fit my taste profile?”

That separation will make the UX much easier to understand.

---

# 4. Recommended ranking definitions

Here’s the version I’d actually ship.

## Smart Sort

Goal: show the most authentic restaurants within the filtered set.

### Formula

Primary:

* `authentic_score desc`

Tie-breakers:

1. `authentic_review_count desc`
2. `overall_rating desc`
3. `review_count desc`
4. `published_at desc`

### Why

This avoids a weak authentic average with 1 review beating a stronger, more proven restaurant.

---

## Highest Rated

Goal: best overall restaurant quality in the filtered set.

### Formula

Primary:

* `overall_rating desc`

Tie-breakers:

1. `review_count desc`
2. `authentic_score desc`
3. `published_at desc`

### Better version

Use a confidence-adjusted rating rather than raw average.

For example:
`weighted_rating = (rating * review_count + global_mean * m) / (review_count + m)`

This prevents tiny-sample restaurants from floating unrealistically to the top.

---

## Lowest Rated

Goal: lowest overall rating in the filtered set.

### Formula

Primary:

* `overall_rating asc`

Tie-breakers:

1. `review_count desc`
2. `published_at desc`

This prevents a place with one weird low review from dominating the very top unless that’s intended.

---

## Newest

Goal: newest restaurants in the filtered set.

### Formula

Primary:

* `published_at desc` or fallback `created_at desc`

Tie-breakers:

1. `database_id desc`

This already aligns with what your doc describes for newest sorting logic .

---

## My Preference

Goal: rank by personal taste relevance.

### Formula

Primary:

* `search_score desc`

Where `search_score` could be:

* palate match strength
* user’s preferred cuisine overlap
* preference review average
* confidence weight
* maybe a small overall rating boost

A practical first version:

`search_score = 0.55 * preference_score + 0.25 * palate_match_score + 0.15 * overall_rating + 0.05 * confidence_factor`

Tie-breakers:

1. `overall_rating desc`
2. `review_count desc`
3. `published_at desc`

The doc says current My Preference uses `searchPalateStats.avg desc` with tie-breakers on count, overall rating, and review count . That’s okay as a base, but I’d rename/reshape it as a deliberate `search_score` so it feels like a proper product feature instead of just “avg of overlap reviews.”

---

# 5. Practical implementation guide

## Phase 1 — Fix the architecture without overbuilding

### Backend/API changes

Update `/api/v1/restaurants-v2/get-restaurants` so the main page always sends:

* `city_id`
* `cuisine_ids`
* `price_range_id`
* `min_rating`
* `sort_mode`
* optional `palate_ids`
* pagination cursor

### Frontend changes

Replace current client-side pipeline logic with:

1. read URL/filter state
2. call API with full filter object
3. render API results
4. append next page using same filter + sort_mode
5. do minimal client-side work only for presentation

### Remove or reduce

* client-side re-sorting of loaded rows
* location threshold filtering after fetch
* hidden filter state that doesn’t affect the query

This directly addresses the doc’s current gap where filter state exists but doesn’t fully drive the API call  .

---

## Phase 2 — Compute reliable sort fields

To make the system fast and stable, I would strongly recommend precomputing these restaurant-level fields:

* `overall_rating`
* `review_count`
* `authentic_score`
* `authentic_review_count`
* `preference_score` or components for it
* `published_at`
* `city_id`
* `cuisine_ids`

Then the main list query becomes much simpler.

### Why this matters

Right now authentic/preference stats are fetched from separate endpoints and cached as approximations . That can work, but it makes the list pipeline more fragile and complicated.

A stronger model is:

* derive scores offline / async / event-driven
* store them on restaurant search rows
* query directly with `ORDER BY`

That makes Smart Sort and My Preference much less buggy.

---

## Phase 3 — Cursor pagination aligned to sort mode

Your doc mentions cursor pagination when ordering by `created_at` and notes stable pagination is tied to the default server order .

Once you support multiple sort modes server-side, cursoring must match each mode.

Examples:

### Newest

Cursor by:

* `published_at desc, database_id desc`

### Highest Rated

Cursor by:

* `weighted_rating desc, database_id desc`

### Lowest Rated

Cursor by:

* `weighted_rating asc, database_id asc`

### Smart Sort

Cursor by:

* `authentic_score desc, authentic_review_count desc, database_id desc`

### My Preference

Cursor by:

* `search_score desc, database_id desc`

This is important so page 2 continues correctly after page 1.

---

# 6. What I would change in your current design specifically

Here’s the blunt version.

## Fix 1

**Top-nav city selector must go into the API query**
Not just `LocationContext`-based post-filtering.

## Fix 2

**Cuisine selection must narrow the dataset**
If Japanese is selected, non-Japanese restaurants should not appear.

## Fix 3

**Sort mode must be server-side**
Do not sort only the loaded rows in React.

## Fix 4

**Smart Sort should sort by restaurant-level authentic score**
Not “best effort after fetching whatever was loaded.”

## Fix 5

**My Preference should become an explicit search score**
Not just hidden overlap averages.

## Fix 6

**Client-side filtering should be reduced to UI-only helpers**
Not core search correctness.

---

# 7. Suggested product logic table

Here’s the version I’d recommend implementing.

| User Input       | Type        | Behavior                                |
| ---------------- | ----------- | --------------------------------------- |
| City selector    | Hard filter | Restrict search to selected city        |
| Cuisine selector | Hard filter | Restrict search to selected cuisine     |
| Price            | Hard filter | Restrict by normalized price band       |
| Min rating       | Hard filter | Restrict to restaurants above threshold |
| Smart Sort       | Sort        | Order by authentic score desc           |
| Highest Rated    | Sort        | Order by overall/weighted rating desc   |
| Lowest Rated     | Sort        | Order by overall/weighted rating asc    |
| Newest           | Sort        | Order by published date desc            |
| My Preference    | Sort        | Order by personal search score desc     |

That’s simple, explainable, and very debuggable.

---

# 8. Recommended short-term patch vs proper fix

## Short-term patch

If you need something quick:

1. pass `city` and `cuisine_ids` into the existing API now
2. filter server-side first
3. keep current client-side sorting temporarily
4. ensure displayed list only contains valid candidates

This won’t fully solve ranking instability, but it will immediately make the results feel much more correct.

---

## Proper fix

1. move all major sorts to server-side
2. precompute authentic and preference search fields
3. cursor paginate by sort mode
4. make URL/filter state the true source of search state

That is the version I’d trust long-term.

---

# 9. My final proposal

If I were rewriting the behavior from your requirements, I would implement this exact rule:

> The selected city and cuisine define the search universe.
> The selected sort mode defines how that universe is ordered.

So:

* City = Kuala Lumpur
* Cuisine = Japanese
* Sort = Smart Sort

means:

> show Kuala Lumpur Japanese restaurants ordered by authentic score descending.

And:

* City = Kuala Lumpur
* Cuisine = Japanese
* Sort = Highest Rated

means:

> show Kuala Lumpur Japanese restaurants ordered by overall rating descending.

And:

* City = Kuala Lumpur
* Cuisine = Japanese
* Sort = My Preference

means:

> show Kuala Lumpur Japanese restaurants ordered by the user’s preference score descending.

That gives you a really coherent product.

If you want, I can turn this into a proper **Product Requirements + Engineering Fix Spec** with:

* target UX behavior
* API contract
* backend query logic
* sorting formulas
* migration plan
* acceptance criteria
* edge cases for QA
