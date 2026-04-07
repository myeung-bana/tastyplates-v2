/**
 * Homepage Quick Finds — maps to `/restaurants?cuisine=<slug>`.
 * Icons: PNGs in `/public/icons/cuisines/` (e.g. `japanese-cuisine.png`).
 */
export interface QuickFindItem {
  slug: string;
  label: string;
  /** PNG filename under /public/icons/cuisines/ */
  iconFile: string;
}

export const QUICK_FINDS: readonly QuickFindItem[] = [
  { slug: "japanese", label: "Japanese", iconFile: "japanese-cuisine.png" },
  { slug: "chinese", label: "Chinese", iconFile: "chinese-cuisine.png" },
  { slug: "korean", label: "Korean", iconFile: "korean-cuisine.png" },
  { slug: "south-east-asian", label: "South East Asian", iconFile: "sea-cuisine.png" },
  { slug: "italian", label: "Italian", iconFile: "italian-cuisine.png" },
  { slug: "mexican", label: "Mexican", iconFile: "mexican-cuisine.png" },
  { slug: "indian", label: "Indian", iconFile: "indian-cuisine.png" },
  { slug: "french", label: "French", iconFile: "french-cuisine.png" },
  { slug: "middle-eastern", label: "Middle Eastern", iconFile: "middle-eastern-cuisine.png" },
  { slug: "north-american", label: "North American", iconFile: "na-cuisine.png" },
] as const;
