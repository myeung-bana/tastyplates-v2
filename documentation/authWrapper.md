# Auth Wrapper Guide (Option A)

Single wrappers that gate content or actions behind login—one place per pattern, no duplicated auth logic or modal state.

---

## Pattern: Option A

- **One wrapper per concern**: e.g. one `AuthenticatedReviewViewer`, one `AuthGatedPage`, one `AuthActionButton`.
- **Session handling in one place**: loading state, "Sign in to view" / SigninModal, and rendering of children only when `user` is set.
- **Call sites stay dumb**: parents pass props; they don’t check `user` or manage SigninModal themselves.

**Already planned (no duplication here):** `AuthenticatedReviewViewer` for ReviewScreen / ReviewScreenDesktop—require login to view the full-screen review viewer; removes comment-section auth delay and centralizes the gate.

---

## Other Functions That Benefit From a Wrapper

### 1. **Auth-gated pages (e.g. Following, For You tab, Listing)**

**Current:** `/following` and Reviews "For You" show "Sign in to see your following feed"; Listing shows "You must be logged in to access this page". Each page implements its own check, copy, and sometimes redirect.

**Wrapper:** `AuthGatedPage` (or `AuthGatedContent`) that:
- Uses `useNhostSession()` (and optional auth loading).
- If session loading → show a single shared loading UI.
- If not authenticated → render a consistent "Sign in to view this" CTA (and optional SigninModal), not page content.
- If authenticated → render `children`.

**Pros:**
- One loading and one "sign in to view" UX for all auth-required pages.
- New auth-required pages only wrap with `<AuthGatedPage>` instead of re-implementing checks and copy.
- Easier to change copy or CTA in one place.

---

### 2. **Auth-gated sections (e.g. RatingSection “Sign in to see your score”)**

**Current:** `RatingSection` (and similar blocks) branch on `isAuthenticated` to show either locked state + "Sign in to see your score" or the real content.

**Wrapper:** `AuthGatedSection` that:
- Takes `children` (authenticated content) and optional `fallback` (e.g. lock icon + short CTA).
- If not authenticated → render fallback (or default lock + "Sign in to see this").
- If authenticated → render `children`.

**Pros:**
- Reusable for any personalized or “premium” section (scores, recommendations, private lists).
- One place to tune lock/CTA styling and behavior.
- Section components stay focused on content, not auth branching.

---

### 3. **Auth action buttons (Check-in, Save restaurant, Write review, Follow)**

**Current:** `CheckInRestaurantButton`, `RestaurantCard` (save/like), restaurant page “Write a review”, follow buttons each manage their own `showSignin` state and open SigninModal when `!user` on click.

**Wrapper:** `AuthActionButton` (or HOC/wrapper) that:
- Wraps a button (or clickable area).
- On click: if `!user` → open shared SigninModal (or inject callback) and do not run the action; if `user` → run the passed action (e.g. `onClick`).

**Pros:**
- No repeated `useState` for SigninModal and no duplicated "if (!user) setShowSignin(true)" in every button.
- One place to attach analytics or logging for "sign-in prompted from action".
- Easier to add "after sign-in, retry action" later in one place.

---

### 4. **CommentsBottomSheet (and similar modals)**

**Current:** Sheet opens for anyone; inside, like/comment checks `user` and shows toasts ("Please sign in to like/comment") or opens SigninModal. Session can still be resolving, so there’s a short period where the UI is undecided.

**Wrapper:** Treat the sheet as auth-gated: only allow opening when the user is logged in (e.g. from ReviewScreen mobile "View all comments"). If the entry point is always behind `AuthenticatedReviewViewer`, the sheet is already effectively gated. Alternatively, an `AuthGatedModal` that renders modal content only when `user` is set (otherwise "Sign in to view" inside the modal) keeps behavior consistent and avoids per-action auth checks inside the sheet.

**Pros:**
- No delay inside the sheet to “determine” if the user can comment/like.
- Single rule: "comments UI is for logged-in users only," either by gate at open or by wrapper around modal content.

---

### 5. **Modals that mix public content with auth-only actions (e.g. ModalPopup2, ReviewBottomSheet)**

**Current:** Modal opens for everyone; like, follow, comment each check `user` and open SigninModal or toast.

**Wrapper:** `AuthGatedModal` (or reuse the same idea as the review viewer): when modal is open, if not authenticated show a single "Sign in to view / interact" view inside the modal (with SigninModal); if authenticated render full content. Optionally use this only for modals that are primarily “interaction” (like, comment, follow) rather than pure read-only content.

**Pros:**
- One pattern for “this modal requires login to be useful.”
- No scattered sign-in prompts per action; clearer UX and less code.

---

### 6. **Settings-style redirect guard (existing pattern)**

**Current:** `SettingsAuthGuard` already does Option A for `/settings/*`: one component, redirect when not authenticated, single loading state.

**Pros:**
- Reuse this pattern for any route that must be logged-in only (e.g. profile edit, tastystudio, drafts). No need to duplicate redirect logic in each page.

---

## Implementation Plan

| Phase | Item | Description |
|-------|------|-------------|
| **1** | **AuthenticatedReviewViewer** | Implement first (already scoped). Gate ReviewScreen / ReviewScreenDesktop behind login; all current call sites switch to this wrapper. |
| **2** | **AuthGatedPage / AuthGatedContent** | Introduce shared wrapper for full-page auth gates. Migrate `/following`, Reviews "For You" content, and Listing (or equivalent) to use it so one loading and one "Sign in to view" UX. |
| **3** | **AuthActionButton** | Add wrapper (or HOC) for buttons that require login. Migrate Check-in, Save restaurant, Write review CTA, and follow buttons to use it; remove per-component SigninModal state where redundant. |
| **4** | **AuthGatedSection** | Add wrapper for sections that show different content when authenticated (e.g. RatingSection). Use for "Sign in to see your score" and any similar blocks. |
| **5** | **CommentsBottomSheet / AuthGatedModal** | Align comments experience with login requirement: either keep sheet only reachable from AuthenticatedReviewViewer, or introduce AuthGatedModal so modal content is only shown when authenticated. Apply same idea to ModalPopup2 / ReviewBottomSheet if they remain in use. |
| **6** | **Reuse SettingsAuthGuard pattern** | Document and reuse for other auth-only routes (e.g. tastystudio, profile edit) instead of adding new one-off redirect logic. |

---

## Principles (no redundancy)

- **One wrapper per pattern**: one viewer wrapper, one page wrapper, one action wrapper, one section wrapper, one modal wrapper (or clear reuse of viewer/modal pattern).
- **Session in the wrapper**: loading and "not authenticated" handling live in the wrapper, not in every child or parent.
- **Call sites**: only compose wrappers and pass props; they don’t check `user` or open SigninModal for these flows.
- **Existing guards**: keep and reuse `SettingsAuthGuard`; don’t re-implement redirect guards in new places.

This guide stays scoped to **Option A (wrapper-based)** and does not duplicate the rationale for the review viewer gate already planned.
