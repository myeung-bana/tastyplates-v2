import { RESTAURANT_CONSTANTS } from '@/constants/utils';

/**
 * Normalize a single palate segment from the URL query string.
 * - Region names (e.g. "East Asian") match case-insensitively and return canonical region keys.
 * - Cuisine slugs are lowercased; spaces become hyphens (e.g. "East Arabian" → "east-arabian").
 * Legacy bookmarks with Title Case (e.g. "Chinese") become "chinese".
 */
export function normalizePalateUrlSegment(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return '';
  const regionKeys = Object.keys(RESTAURANT_CONSTANTS.REGIONAL_PALATE_GROUPS) as string[];
  const found = regionKeys.find((r) => r.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  return trimmed.toLowerCase().replace(/\s+/g, '-');
}

/** Normalize a palate slug for Hasura JSONB `_contains: [{ slug }]` (lowercase, hyphenated). */
export function normalizePalateSlugForApi(slug: string): string {
  return slug.trim().toLowerCase().replace(/\s+/g, '-');
}
