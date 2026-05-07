# Product Requirements Document — Tastyplates

---

## What is Tastyplates?

Tastyplates is a **restaurant discovery and review platform** built for people who genuinely care about food.

It is not a generic listing directory. It is not a map app with star ratings bolted on. It is a place where food lovers can document their dining experiences, share them with people who share their taste, and discover restaurants through the lens of people whose palates actually match their own.

The core premise is simple: **the best restaurant recommendation is one that comes from someone who eats like you do.**

Tastyplates is designed to feel social and personal — more like a feed of stories from people you follow than a spreadsheet of restaurant data. The experience should feel closer to scrolling through a beautifully curated photo feed than flipping through a review aggregator.

---

## Who is this for?

### The everyday food lover

Someone who wants to find a great place to eat in their city — not the most-reviewed or the most-talked-about, but the place that a person with their exact taste profile would genuinely love. They browse by cuisine, by vibe, by location. They look at what people who share their palate are saying. They save places they want to try and check in when they've been.

### The food creator / documenter

Someone who photographs their food, writes thoughtful reviews, and wants their content to live somewhere more meaningful than a buried Google review. **TastyStudio** is built specifically for them — a dedicated space to manage, publish, and track their reviews in a creator-friendly environment.

### The social diner

Someone who follows friends, tastemakers, and food personalities whose judgment they trust. They browse a **following feed** of recent reviews from the people they follow. They interact — they like reviews, leave comments, discover new places through the people they already know.

---

## What does the experience actually feel like?

### Discovery should feel effortless

When you open Tastyplates, you should land somewhere that immediately makes sense for where you are. The restaurants shown are relevant to your city, sorted by what matters — not just raw review counts, but quality signals that account for your palate preferences.

Browsing should feel smooth. Infinite scroll that doesn't stutter. Filters that respond instantly. Search that rewards intent, not just keyword matching.

### Reviews should feel human

A Tastyplates review is not a form you fill out. It is a moment you document. You pick a restaurant, write what you experienced, rate it, and attach photos. It lives on your profile and shows up in the feeds of people who follow you.

Reading reviews should feel like reading short stories, not data entries. The review viewer is designed to be immersive — full-screen, swipeable, photo-forward.

### Interactions should feel instant

Liking a review, leaving a comment, following someone — these need to feel immediate. There should be no moment where you tap and wait and wonder if it registered. The app responds first, then confirms with the server in the background. If something goes wrong, it gracefully reverts and tells you.

### Uploading photos should be painless

The most common friction point in review apps is the photo upload. Tastyplates handles this with a single smooth progress experience — one progress bar, no stacked notifications, no mystery about whether your upload succeeded. Photos are automatically optimized in the background (AVIF/WebP format) so they load fast for everyone who views them.

---

## What Tastyplates is NOT

Understanding what we deliberately don't do is just as important as knowing what we do.

**It is not a booking platform.** There are no reservation flows, no OpenTable integrations, no seating availability. We help you decide *where* to go — what you do once you've decided is up to you.

**It is not a price comparison or deal site.** There are no discount coupons, no "X% off" promotions, no cashback mechanics. The goal is authentic food discovery, not transaction-driven incentives.

**It is not a data aggregator.** We don't scrape restaurant information and present it as our own. Restaurants are discovered and reviewed by real users, and the quality of the product depends entirely on the authenticity of those reviews.

**It is not a business management tool.** Restaurant owners don't have dashboards, don't respond to reviews, and don't manage their listings through Tastyplates. That may change in the future, but right now the product is entirely focused on the diner's experience.

**It is not a social network in the broad sense.** There are no DMs, no stories, no status updates. The social layer exists purely to make discovery more personal — you follow people to see what they're eating, not to maintain a relationship.

---

## Core product flows

### Signing in and getting started

A user creates an account with their email and password, or signs in with Google. Once they verify their email, they go through a short onboarding flow — the most important part of which is selecting their **palates** (the cuisine types they gravitate toward). This is the foundation of personalized discovery. After onboarding, they land on the main experience.

### Discovering restaurants

The `/restaurants` page is the primary discovery surface. Users can:

- Browse restaurants for their selected city
- Filter by cuisine type, price range, or minimum rating
- Sort by overall quality, by palate match, or manually by rating
- See curated sections like "Recommended for you" (city-scoped editorial picks) and "Featured restaurants" (homepage highlight)

The most interesting behavior is **palate-based ranking**: restaurants reviewed by users who share your palate preferences surface first, with ratings calculated specifically from those matching reviewers. If no palate match exists, restaurants fall back to overall quality ranking.

### Reading and engaging with reviews

Reviews are the heart of the product. From a restaurant page or the home feed, users can:

- View reviews in a full-screen immersive viewer (swipeable on mobile)
- Like a review (instant, optimistic — the count updates before the server responds)
- Leave a comment or reply to an existing comment
- Follow the reviewer to see their future reviews in their feed

The **home feed** shows a mix of recent reviews. The **following feed** shows only reviews from people the user follows — a more personal, curated experience.

### Writing and publishing a review

From TastyStudio, a creator can:

- Search for a restaurant and attach their review to it
- Write their experience, rate the food, and upload photos
- Manage their draft and published reviews in a dedicated listing
- Edit or delete existing reviews

The review submission experience is designed to be quick and low-friction. Photo uploads run with a clear progress bar so there's no ambiguity about whether the images are processing.

### Saving and tracking

Users can save restaurants to a **wishlist** (places they want to try) and log **check-ins** (places they've actually been). Both are accessible from their profile.

### Social graph

Users can follow other users, and their following/follower lists are visible on their profile. Following someone means their reviews appear in your following feed. Tastyplates surfaces **suggested users** to follow — people whose palates likely overlap with yours.

---

## Platforms

Tastyplates is designed to feel great in three environments:

- **Web** — the full experience, served as a standard Next.js application
- **PWA** — installable on mobile home screens, with offline-capable behavior where configured
- **Native wrapper** (Capacitor) — a thin native app build for iOS/Android, using the same web codebase exported as a static app

The mobile experience is first-class, not an afterthought. The bottom navigation, swipeable viewers, haptic feedback on interactions, and gesture-friendly UI elements all exist because a significant portion of the audience uses Tastyplates on their phone.

---

## What success looks like for users

Success is not a metric on a dashboard. It is the moment a user opens Tastyplates, sees a review from someone they follow, and thinks: *I need to go there.*

More concretely:

- A new user completes onboarding and immediately sees restaurants that feel relevant to them
- A food creator publishes a review in under two minutes with photos, and it looks great
- A diner finds a restaurant they've never heard of through the following feed, visits it, and posts their own review
- Someone opens Tastyplates on their phone in a new city and within 30 seconds has a shortlist of places to eat that actually match their taste

---

## Out of scope (by design)

These are deliberate product boundaries, not technical limitations:

- Owning the database schema and migrations — that is managed by the `tastyplates-nhost` project
- Restaurant management features for business owners
- Real-time features (live like counts, live comments) — the current model is optimistic/near-real-time, not WebSocket-driven
- Booking or reservation integrations
- User-to-user messaging
- Storing or exposing any backend admin credentials in the browser

---

## Site structure and page map

Every page in the app exists for a specific reason. Below is the full map of pages, grouped by the area of the product they belong to.

---

### Public / entry point

| Page | Route | What it does |
|------|-------|--------------|
| **Home** | `/` | The landing experience. Shows the main review feed and featured/recommended restaurants. No sign-in required to browse. |
| **Restaurants** | `/restaurants` | The main discovery page. Browse, filter, and sort restaurants by location, cuisine, palate match, and rating. |
| **Restaurant detail** | `/restaurants/[slug]` | A single restaurant's full profile — photos, address, ratings breakdown, all reviews. |
| **Cuisine browse** | `/restaurants/cuisines/[slug]` | Filtered restaurant view for a specific cuisine type. |
| **Hashtag feed** | `/hashtag/[hashtag]` | Reviews tagged with a specific hashtag. |
| **Articles (browse)** | `/articles` | Browse all food articles and editorial content. |
| **Article (read)** | `/articles/[slug]` | A single article, full read view. |
| **Review viewer** | `/reviews/viewer` | Full-screen immersive review viewer, opened from cards in the feed or restaurant page. |

---

### Authentication

These pages handle the sign-in, sign-up, and recovery flows. They are accessible to unauthenticated users.

| Page | Route | What it does |
|------|-------|--------------|
| **Login** | `/login` | Email/password sign-in or Google OAuth. |
| **Register** | (modal / same entry as login) | Create a new account with email/password or Google. |
| **User verification** | `/user-verification` | Shown after sign-up when email has not yet been verified. User can resend the verification email from here. |
| **Onboarding** | `/onboarding` | Shown after email verification. The user sets up their profile and selects their palate preferences. Required before accessing the full app. |
| **Forgot password** | (modal) | User enters their email to receive a reset link. |
| **Reset password** | `/reset-password` | User lands here from the email link and sets a new password. Nhost handles the token exchange. |

---

### Authenticated feed and social

These pages require a signed-in user.

| Page | Route | What it does |
|------|-------|--------------|
| **Following feed** | `/following` | Reviews from people the current user follows — the most personal, curated view of new content. |

---

### User profile

| Page | Route | What it does |
|------|-------|--------------|
| **Own profile** | `/profile` | The current user's public profile — their reviews, wishlists, check-ins, followers, and following. |
| **Edit own profile** | `/profile/edit` | Edit display name, bio, profile photo, and palate preferences. |
| **Public profile** | `/profile/[username]` | Another user's public profile — same layout, viewed in read-only mode with follow/unfollow action. |

---

### TastyStudio — creator hub

TastyStudio is the dedicated section for users who create reviews. It has its own layout with a left sidebar on desktop.

| Page | Route | What it does |
|------|-------|--------------|
| **Studio dashboard** | `/tastystudio/dashboard` | Overview of the creator's activity — review count, recent posts, quick actions. |
| **Add review (search)** | `/tastystudio/add-review` | Step 1 of creating a review — search for and select the restaurant. |
| **Add review (write)** | `/tastystudio/add-review/[slug]` | Step 2 — write the review, rate the experience, and attach photos for a specific restaurant. |
| **Add review (create new)** | `/tastystudio/add-review/create` | Alternative entry point to add a new restaurant listing before reviewing it. |
| **Review submitted** | `/tastystudio/add-review/success` | Confirmation screen shown after a review is published. |
| **Review listing** | `/tastystudio/review-listing` | All of the creator's reviews — published and drafts — with edit and delete options. |
| **Edit review** | `/tastystudio/edit-review/[id]` | Edit an already-published or draft review. |

---

### Restaurant listing (add a restaurant)

For users who want to add a restaurant that doesn't exist in the database yet.

| Page | Route | What it does |
|------|-------|--------------|
| **Listing explanation** | `/listing/explanation` | Explains what it means to add a restaurant listing and what information is needed. |
| **Listing step 1** | `/listing/step-1` | Core restaurant information — name, address, cuisine, photos. |
| **Listing step 2** | `/listing/step-2` | Additional details and confirmation before submission. |
| **Listing draft** | `/listing/draft` | Saved drafts for restaurant listings that haven't been submitted yet. |

---

### Settings

| Page | Route | What it does |
|------|-------|--------------|
| **Settings home** | `/settings` | Top-level settings categories. |
| **Profile settings** | `/settings/account-security/profile` | Update email, birthdate, gender. |
| **Password settings** | `/settings/account-security/password` | Change password or request a reset email. |
| **Language settings** | `/settings/general/language` | Set the app's preferred display language. |
| **About** | `/settings/support/about` | App version and basic info. |

---

### Legal and transparency

| Page | Route | What it does |
|------|-------|--------------|
| **Privacy policy** | `/privacy-policy` | How user data is collected and used. Includes AdSense and cookie disclosure. |
| **Cookie policy** | `/cookie-policy` | Explains the cookie consent model. Accepting enables AdSense; declining does not. |
| **Terms of service** | `/terms-of-service` | The terms users agree to when creating an account. |
| **Content guidelines** | `/content-guidelines` | What is and isn't acceptable in reviews, photos, and comments. |

---

## User journeys

These are the four primary paths a user takes through the product. Every page and interaction maps back to one of these journeys.

---

### Journey 1 — The new user (first visit to first review read)

This is the most critical path. It needs to be frictionless and rewarding from the very first second.

```
/ (Home)
  └─ Sees the review feed and restaurant highlights
       └─ Clicks a review card
            └─ /reviews/viewer  (immersive review viewer, no sign-in required)
                 └─ Decides to explore further
                      └─ /restaurants  (browse + discover)
                           └─ Clicks a restaurant
                                └─ /restaurants/[slug]  (restaurant detail + all reviews)
                                     └─ Wants to save or like → prompted to sign in
                                          └─ /login  →  sign up  →  /user-verification
                                               └─ /onboarding  (set palates)
                                                    └─ Back to /restaurants
                                                         (now sees palate-ranked results)
```

**Key experience goal:** The user should be able to browse and read reviews before they ever touch a sign-up form. The wall comes only when they want to participate (like, save, follow).

---

### Journey 2 — The returning diner (opens app → finds somewhere to eat)

A signed-in user opening the app with a specific intent: "I want to find somewhere good to eat."

```
/ (Home)
  └─ Scans the feed for inspiration
       OR
  └─ /restaurants
       └─ Selects city/location
            └─ Applies cuisine filter or palate sort
                 └─ Browses restaurant cards
                      └─ /restaurants/[slug]
                           └─ Reads reviews from the viewer
                                └─ Saves to wishlist
                                     └─ OR follows the reviewer
                                          └─ /profile/[username]
                                               └─ Follows → now sees their reviews in /following
```

**Key experience goal:** Going from "I want food" to "I know where I'm going" in under 60 seconds.

---

### Journey 3 — The food creator (visited somewhere → publishes a review)

A user who just ate somewhere and wants to share it.

```
/tastystudio/dashboard  (or BottomNav → Studio shortcut)
  └─ /tastystudio/add-review
       └─ Searches for the restaurant
            └─ Restaurant found → /tastystudio/add-review/[slug]
                 └─ Writes review text, sets rating, attaches photos
                      └─ Photos upload with progress bar (no stacked toasts)
                           └─ Submits
                                └─ /tastystudio/add-review/success
                                     └─ Review appears in their profile + home feed
                                          └─ Visible to followers in /following
```

**Key experience goal:** Publishing a review — including photos — should take less than 2 minutes and feel effortless. The progress bar during upload replaces the anxiety of "is this working?"

If the restaurant doesn't exist yet:
```
/tastystudio/add-review
  └─ Restaurant not found in search
       └─ /listing/explanation  →  /listing/step-1  →  /listing/step-2
            └─ Restaurant added to the database
                 └─ Back to /tastystudio/add-review/[new-slug]
                      └─ Continues with review creation
```

---

### Journey 4 — The social browser (catching up with the feed)

A signed-in user who follows several people and wants to see what they've been eating.

```
/following  (Following feed, accessed from BottomNav)
  └─ Scrolls through reviews from followed users (cursor-paginated, infinite scroll)
       └─ Likes a review → heart updates instantly (optimistic)
            └─ Taps a review card
                 └─ /reviews/viewer
                      └─ Reads full review + comments
                           └─ Leaves a comment
                                └─ Sees the reviewer's profile
                                     └─ /profile/[username]
                                          └─ Views their other reviews
                                               └─ Discovers a restaurant they haven't seen before
                                                    └─ /restaurants/[slug]
```

**Key experience goal:** The following feed should feel alive and personal. Every interaction (like, comment, follow from a review) should be instant — no waiting, no spinners blocking the experience.

---

## Non-functional requirements

These are the baseline standards that every feature must meet:

- **Security** — Admin secrets never reach the browser. User identity is always derived from the active auth session, never from user-supplied inputs.
- **Performance** — The feed must scroll smoothly. The first meaningful content should appear fast. Uploads must show clear progress.
- **Reliability** — If Redis is unavailable, the app falls back to direct data queries. If rate limits fail, requests are allowed through. No feature should produce a hard crash because an optional system is down.
- **Consistency** — The UI must feel like one product. Components, spacing, colors, and interactions follow the conventions in `AI_Rules.md`. Rogue inline styles, inconsistent spacing, and off-brand colors are not acceptable.
