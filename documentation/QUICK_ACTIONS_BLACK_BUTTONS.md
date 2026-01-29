# Quick Actions Section - Black Stroke Buttons

**Date:** 2026-01-29  
**Status:** ✅ **COMPLETE**

---

## 🎯 **Objective**

Move Website, Call, and Directions buttons from the restaurant header into the Quick Actions sidebar section, and style all Quick Actions buttons with black stroke (border) and black text.

---

## ✨ **Changes Made**

### 1. **RestaurantQuickActions.tsx** - Added 4 Action Buttons

All buttons now use consistent black stroke styling:

```tsx
// Black stroke button style
className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-50 transition-colors font-neusans font-normal"

// Disabled button style
className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-400 border-2 border-gray-200 rounded-xl cursor-not-allowed font-neusans font-normal"
```

**Button Order:**
1. ✍️ **Write a Review** (always available)
2. 🌐 **Website** (conditional - disabled if no menuUrl)
3. 📞 **Call** (conditional - disabled if no phone)
4. 🗺️ **Directions** (always available - uses Google Maps)

**Features:**
- Full-width buttons for better mobile UX
- Consistent spacing with `space-y-3`
- Black `border-2` for emphasis
- Disabled state with gray styling when data unavailable
- Hover effect changes background to `bg-gray-50`

---

### 2. **RestaurantHeader.tsx** - Cleaned Up

**Removed:**
- Website, Call, and Directions button grid
- Write a Review button (now in Quick Actions)
- Unused imports: `FiEdit3`, `FiPhone`, `FiGlobe`, `FiNavigation`
- Unused helper functions: `phone`, `websiteUrl`, `getDirectionsUrl()`

**Kept:**
- Location badge at top
- 120px circular image
- Restaurant title
- Ethnic palate badge (orange)
- Categories with bullet separators
- Price range
- **Save** and **Check-In** buttons (existing pill style)

---

### 3. **page.tsx** - Updated Props

```tsx
// Before
<RestaurantQuickActions onAddReview={addReview} />

// After
<RestaurantQuickActions onAddReview={addReview} restaurant={restaurant} />
```

Now passes the full `restaurant` object so Quick Actions can access phone, website, and location data.

---

## 📐 **Button Styling Comparison**

### Black Stroke Buttons (Quick Actions)
```tsx
border-2 border-black    // Thick black border
text-black               // Black text
bg-white                 // White background
rounded-xl               // Modern rounded corners
hover:bg-gray-50         // Subtle hover
w-full                   // Full width
py-3                     // Taller padding
```

### Pill Buttons (Save, Check-In - Header)
```tsx
border border-gray-300   // Thin gray border
text-gray-500            // Gray text
bg-white                 // White background
rounded-[50px]           // Pill shape
hover:bg-gray-50         // Subtle hover
px-4 py-2                // Compact padding
```

**Why Different?**
- Quick Actions are **primary CTAs** → Bold black borders
- Save/Check-In are **secondary actions** → Subtle gray borders
- Consistent design language throughout

---

## 🎨 **Visual Layout**

### Restaurant Header (Top)
```
┌─────────────────────────────────────┐
│  📍 Shibuya, Tokyo                  │
├─────────────────────────────────────┤
│   ⭕      OKONOMIYAKI CHIBO         │
│  [120px]  Japanese 🟠               │
│           Bar • Family Restaurant   │
│           $$                        │
│                                     │
│ [❤️ Save] [✓ Check-In]               │ ← Kept pill style
└─────────────────────────────────────┘
```

### Quick Actions Sidebar (Right)
```
┌─────────────────────────────────────┐
│  Quick Actions                      │
├─────────────────────────────────────┤
│  [ ✍️ Write a Review ]              │ ← Black stroke
│  [ 🌐 Website ]                     │ ← Black stroke
│  [ 📞 Call ]                        │ ← Black stroke
│  [ 🗺️ Directions ]                  │ ← Black stroke
└─────────────────────────────────────┘
```

All buttons are full-width, vertically stacked with consistent spacing.

---

## 🔧 **Technical Details**

### RestaurantQuickActions Props
```typescript
interface RestaurantQuickActionsProps {
  onAddReview: () => void;      // Callback to open review modal
  restaurant: Listing;           // Full restaurant data
}
```

### Data Sources
- **Website:** `restaurant.listingDetails?.menuUrl`
- **Phone:** `restaurant.listingDetails?.phone`
- **Directions:** Uses `latitude` + `longitude` if available, fallback to search by name

### Helper Function
```typescript
const getDirectionsUrl = () => {
  const lat = restaurant.listingDetails?.latitude;
  const lng = restaurant.listingDetails?.longitude;
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  // Fallback to search
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(...)}`;
};
```

---

## 📱 **Responsive Behavior**

### Mobile
- Quick Actions sidebar appears below main content
- All buttons are full-width for easy tapping
- Icons and text clearly visible

### Desktop (lg+)
- Quick Actions sidebar is sticky at `top-24`
- Fixed width of `375px`
- Buttons maintain full width within sidebar

---

## ✅ **Benefits**

1. **Better Organization**
   - Primary actions grouped in one place
   - Clear visual hierarchy

2. **Consistent Styling**
   - All Quick Actions use same black stroke style
   - Reinforces importance of these CTAs

3. **Mobile-Friendly**
   - Full-width buttons easier to tap
   - Vertical stacking works well on small screens

4. **Cleaner Header**
   - Less cluttered restaurant header
   - Focus on restaurant information, not actions

5. **Accessibility**
   - Larger touch targets
   - Clear disabled states
   - Semantic HTML (buttons vs links)

---

## 📁 **Files Modified**

1. **`src/components/Restaurant/Details/RestaurantQuickActions.tsx`**
   - Added Website, Call, Directions buttons
   - Changed all buttons to black stroke style
   - Added restaurant prop to interface

2. **`src/components/Restaurant/Details/RestaurantHeader.tsx`**
   - Removed Website, Call, Directions buttons
   - Removed Write a Review button
   - Cleaned up unused imports and helper functions
   - Kept Save and Check-In buttons

3. **`src/app/restaurants/[slug]/page.tsx`**
   - Added `restaurant` prop to `RestaurantQuickActions`

---

## 🧪 **Testing Checklist**

- [ ] Write a Review button works in Quick Actions
- [ ] Website button links correctly (or disabled)
- [ ] Call button creates tel: link (or disabled)
- [ ] Directions button opens Google Maps
- [ ] All Quick Actions buttons have black stroke
- [ ] Hover effects work (gray background)
- [ ] Disabled states show gray styling
- [ ] Save button still works in header
- [ ] Check-In button still works in header
- [ ] Mobile layout: buttons are full-width
- [ ] Desktop layout: sidebar is sticky

---

## 🎨 **Design System**

### Color Palette
- **Active buttons:** `border-black`, `text-black`, `bg-white`
- **Hover:** `hover:bg-gray-50`
- **Disabled:** `border-gray-200`, `text-gray-400`, `bg-gray-50`

### Spacing
- Button padding: `px-4 py-3`
- Gap between buttons: `space-y-3`
- Card padding: `p-6`

### Typography
- All text: `font-neusans font-normal`
- Consistent sizing across all buttons

---

**Result:** A clean, organized Quick Actions section with bold black stroke buttons that emphasize the primary CTAs while keeping the header focused on restaurant information! 🎉
