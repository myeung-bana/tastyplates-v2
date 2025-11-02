# Restaurant Search Algorithm - Implementation Guide

## 🎯 Overview

This document explains the comprehensive search and sorting algorithm implemented for the `/restaurants` page.

## 📊 Core Algorithm

### **Three Search Modes**

#### **1. Palate-Based Search (User selects palates)**
```
Example: /restaurants?palates=East+Asian
```

**Two-Tier Result Ordering:**

**Tier 1: Restaurants WITH Matching Palate Reviews**
- Primary Sort: `searchPalateStats.avg` (DESC) - Average rating from users with matching palates
- Secondary Sort: `searchPalateStats.count` (DESC) - Number of matching palate reviews
- Tertiary Sort: `rating` (DESC) - Overall restaurant rating

**Tier 2: Restaurants WITHOUT Matching Palate Reviews**
- Primary Sort: `rating` (DESC) - Overall restaurant rating
- Secondary Sort: `ratingsCount` (DESC) - Total number of reviews

**Result:** Users see highly-rated restaurants reviewed by people with similar palates first, followed by other quality restaurants.

---

#### **2. Default Search (No palates selected, no sort option)**
```
Example: /restaurants
```

**Smart Quality Sorting:**
- Primary Sort: `rating` (DESC) - Only if difference > 0.1 stars
- Secondary Sort: `ratingsCount` (DESC) - More reviews = more reliable
- Tertiary Sort: `recognitionCount` (DESC) - Badge/recognition count

**Result:** Shows highest quality, most reviewed restaurants first.

---

#### **3. Manual Sort (User selects ASC/DESC)**
```
Example: /restaurants?sortOption=DESC
```

**Simple Rating Sort:**
- ASC: Lowest to Highest rating
- DESC: Highest to Lowest rating

---

## 🔧 Technical Implementation

### Location: `src/components/Restaurant/Restaurant.tsx`

### Key Function: `sortRestaurants()`

```typescript
const sortRestaurants = (
  restaurants: Restaurant[], 
  selectedPalates: string[], 
  sortOption: string | null, 
  locationKeyword?: string
) => {
  // 1. Apply location-based sorting first (if provided)
  // 2. Apply palate-based or quality-based sorting
  // 3. Return sorted array
}
```

### Data Flow

```
User Selects Palate → "East Asian"
           ↓
Frontend Expands → ["Chinese", "Japanese", "Korean", "Mongolian", "Taiwanese"]
           ↓
GraphQL Query → palates: "Chinese,Japanese,Korean,Mongolian,Taiwanese"
           ↓
Backend (WordPress) → get_search_based_stats()
  - Filters reviews from users with matching palates
  - Calculates average rating: searchPalateStats.avg
  - Counts matching reviews: searchPalateStats.count
           ↓
Frontend Receives → Restaurant objects with searchPalateStats
           ↓
Client-Side Sorting → Two-tier ordering
           ↓
Display → Tier 1 restaurants first, then Tier 2
```

---

## 📈 What Gets Calculated

### Backend (WordPress PHP)

**Function:** `get_search_based_stats($post_id, $search_palates_string)`

```php
// For each restaurant:
1. Get all approved reviews
2. Filter reviews where reviewer's palates match search palates
3. Calculate average rating from matching reviews
4. Count matching reviews
5. Return: { avg: 4.7, count: 25 }
```

**Example:**
- Restaurant: "Sushi Den"
- Search: "Japanese,Korean"
- Reviews: 50 total
- Matching Reviews: 25 from users with Japanese/Korean palate
- searchPalateStats: { avg: 4.7, count: 25 }

---

## 🎨 User Experience

### Scenario 1: User searches "East Asian" restaurants

**What User Sees:**
```
🥇 Tier 1: Highly Rated by East Asian Users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Sushi Den         4.8★ (25 East Asian reviews)
2. Korean BBQ House  4.7★ (18 East Asian reviews)
3. Dim Sum Palace    4.5★ (30 East Asian reviews)

📋 Tier 2: Other Quality Restaurants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. New Ramen Spot    4.7★ (5 total reviews)
5. Thai Fusion       4.3★ (12 total reviews)
```

### Scenario 2: User browses without selecting palate

**What User Sees:**
```
📊 All Restaurants Sorted by Quality
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Premium Restaurant  4.8★ (150 reviews)
2. Popular Spot        4.7★ (200 reviews)
3. Local Favorite      4.7★ (85 reviews)
4. New Place           4.6★ (45 reviews)
```

---

## 🐛 Debug Logging

The algorithm includes console logging to help verify correct operation:

**When palates are selected:**
```javascript
🎯 Search Results by Tier:
  Tier 1 (WITH palate reviews): 15 restaurants
  Tier 2 (WITHOUT palate reviews): 25 restaurants
  Top 3 Tier 1: ["Sushi Den: 4.8★ (25 reviews)", ...]
```

**When no palates selected:**
```javascript
📊 Showing all restaurants sorted by overall quality
```

---

## 🔑 Key Features

### ✅ Addresses Original Issues

1. **Restaurants with no palate reviews don't look empty**
   - They appear in Tier 2, sorted by overall rating
   - Users still see all options

2. **Non-authenticated or no-palate users see relevant results**
   - Smart default sorting by quality
   - Most reviewed and highest rated restaurants appear first

### ✅ Additional Enhancements

3. **Float comparison safety**
   - Uses `Math.abs(diff) > 0.01` to avoid precision issues

4. **Comprehensive tiebreakers**
   - Review count when ratings are similar
   - Recognition badges as final tiebreaker

5. **Location-aware sorting**
   - Location filters apply first
   - Then palate/quality sorting

---

## 📝 Configuration Constants

From `src/constants/utils.ts`:

```typescript
RESTAURANT_CONSTANTS = {
  DEFAULT_RESULTS_PER_PAGE: 8,
  INITIAL_LOAD_RESULTS: 16,
  
  REGIONAL_PALATE_GROUPS: {
    "East Asian": ["Chinese", "Japanese", "Korean", "Mongolian", "Taiwanese"],
    "South Asian": ["Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepalese", "Afghan"],
    // ... more regions
  }
}
```

---

## 🧪 Testing Recommendations

### Test Cases

1. **Palate Search with Results**
   - URL: `/restaurants?palates=East+Asian`
   - Expected: See Tier 1 and Tier 2 separation

2. **Palate Search with Few Results**
   - URL: `/restaurants?palates=Mongolian`
   - Expected: Few Tier 1, many Tier 2 restaurants

3. **No Palate Search**
   - URL: `/restaurants`
   - Expected: Quality-sorted restaurants

4. **Manual Sort**
   - URL: `/restaurants?sortOption=ASC`
   - Expected: Lowest to highest rating

5. **Combined Filters**
   - URL: `/restaurants?palates=Japanese&price=$$$&rating=4`
   - Expected: Filtered and sorted correctly

---

## 🚀 Future Enhancements (Optional)

### Visual Indicators
Add badges to restaurant cards showing why they're ranked:
```tsx
{restaurant.searchPalateStats?.count > 0 && (
  <div className="palate-match-badge">
    🎯 {restaurant.searchPalateStats.avg}★ by {selectedPalates[0]} users
  </div>
)}
```

### Personalization
For logged-in users, could add a third tier:
- Tier 1: Matching palate reviews
- Tier 2: Reviews from followed users
- Tier 3: All other restaurants

---

## 📞 Support

For questions or issues with the search algorithm, refer to:
- Code: `/src/components/Restaurant/Restaurant.tsx` (lines 203-292)
- Backend: `/documentation/dev-chrono-plugin.php` (function `get_search_based_stats`)
- Constants: `/src/constants/utils.ts`

---

Last Updated: November 2, 2025

