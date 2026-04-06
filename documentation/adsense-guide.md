# Google AdSense — TastyPlates checklist

This guide summarizes **what Google expects** for AdSense review and **how this repo implements** those expectations. It is not legal advice; read the current [AdSense Program policies](https://support.google.com/adsense/answer/48182) and [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10437842).

TastyPlates is a **restaurant discovery and reviews** product. That category is generally AdSense-eligible if public content is substantive and policy-compliant.

---

## 1. What Google checks

- A **real, navigable site** with **original, useful** public content (not thin or placeholder-only).
- **Clear ownership** of the domain and a coherent UX (no broken core flows, no deceptive UI).
- **Policy compliance** (prohibited content, copyright, invalid traffic).
- **Transparency** for ads/cookies: privacy and cookie disclosures; where required, **consent before** personalized or storage-based advertising.

---

## 2. Implemented in this codebase

### Technical

| Item | Location / behavior |
|------|---------------------|
| **`google-adsense-account` meta** | `src/lib/seo.ts` → `generateMetadata()` adds `other["google-adsense-account"]` when **`NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID`** is set (e.g. `ca-pub-…`). |
| **`/ads.txt`** | `src/app/ads.txt/route.ts` — builds the standard `google.com, pub-…, DIRECT, …` line from the same env var (strips leading `ca-` for the ads.txt field). Optional **`NEXT_PUBLIC_ADSENSE_CERTIFICATION_AUTHORITY_ID`** (defaults to Google’s `f08c47fec0942fa0`). If the env var is unset, the file returns a `#` comment line (200). |
| **AdSense script** | `src/components/layout/CookieConsentAndAdSense.tsx` — loads `adsbygoogle.js` **only after** the user clicks **Accept** on the cookie banner. Uses the same **`NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID`** as the `client=` parameter. **Decline** → script never loads. |
| **Cookie choice storage** | `src/constants/cookieConsent.ts` — `localStorage` key `tastyplates_cookie_consent` (`accepted` \| `declined`). |
| **`robots.txt`** | `src/app/robots.ts` — dynamic rules + sitemap URL from `siteConfig.url` (`NEXT_PUBLIC_SITE_URL`). |

### Legal pages & discovery

| Item | Location |
|------|----------|
| **Privacy Policy** | `/privacy-policy` — `content/legal/privacy-policy.md` (includes AdSense / advertising section). |
| **Cookie Policy** | `/cookie-policy` — `content/legal/cookie-policy.md` (banner behavior + AdSense). |
| **Terms** | `/terms-of-service` |
| **Desktop footer** | `src/components/layout/Footer.tsx` — Terms, Content Guidelines, **Cookie Policy** (`COOKIE_POLICY`), Privacy. |
| **Mobile legal strip** | `src/components/layout/MobileLegalStrip.tsx` — Privacy, Terms, Cookies (`md:hidden`, rendered from `ConditionalFooter.tsx` so links exist where the main footer is hidden). |

### Root layout wiring

- `src/app/layout.tsx` — renders **`CookieConsentAndAdSense`** after **`BottomNav`** (banner sits above the bottom tab bar on small screens).

---

## 3. Environment variables (production)

Set in the host (e.g. Vercel) to match your AdSense account:

```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
# Optional:
# NEXT_PUBLIC_ADSENSE_CERTIFICATION_AUTHORITY_ID=f08c47fec0942fa0
```

Also align **`NEXT_PUBLIC_SITE_URL`** with the exact origin you submit to AdSense (`https`, `www` vs apex).

---

## 4. Pre-submit checklist

- [ ] Production domain in AdSense matches live site (including `https` and `www` vs apex).
- [ ] **`/ads.txt`** returns the correct `google.com, pub-…, DIRECT, …` line (not only a `#` comment).
- [ ] **`google-adsense-account` meta** and **`/ads.txt`** and **consent-gated script** use the **same** publisher ID.
- [ ] `/privacy-policy`, `/cookie-policy`, `/terms-of-service` load and reflect actual behavior (Accept → AdSense loads; Decline → it does not).
- [ ] **Mobile:** legal links visible (strip under main content); cookie banner usable above bottom nav.
- [ ] No mass placeholder content; sample restaurant/review URLs look legitimate.
- [ ] After approval: place **ad units** in layouts without breaking primary UX (avoid covering mobile bottom nav or main CTAs).

---

## 5. Optional follow-ups

- Gate **other** third-party scripts (e.g. Bing Clarity) behind the same or a stricter consent model if legal review requires it.
- Add a **“Cookie settings”** entry point to re-open the banner after a choice (clear `tastyplates_cookie_consent` and reload, or lift banner state).
- If **`/profile/`** is disallowed in `robots.ts` by design, that is an SEO choice; it does not block AdSense site review if the rest of the site is crawlable and substantive.

---

## 6. File map

| Topic | Path |
|--------|------|
| AdSense meta | `src/lib/seo.ts` |
| `ads.txt` | `src/app/ads.txt/route.ts` |
| Consent + AdSense script | `src/components/layout/CookieConsentAndAdSense.tsx` |
| Consent storage key | `src/constants/cookieConsent.ts` |
| Mobile legal links | `src/components/layout/MobileLegalStrip.tsx`, `ConditionalFooter.tsx` |
| Desktop footer | `src/components/layout/Footer.tsx` |
| Legal markdown | `content/legal/privacy-policy.md`, `content/legal/cookie-policy.md` |
| Crawling | `src/app/robots.ts`, `src/app/sitemap.ts` |

---

*Last updated for the TastyPlates v2 Next.js app.*
