/**
 * Utility functions for working with palate preferences
 * Handles normalization, matching, and similarity calculations
 */

/**
 * Normalize palates to a consistent array format
 * Handles: string (pipe-separated), array of strings, array of objects
 * @param palates - Palates in any format (string, array, null, undefined)
 * @returns Normalized array of lowercase palate strings
 */
export function normalizePalates(palates: string | string[] | any[] | null | undefined): string[] {
  if (!palates) return [];
  
  if (Array.isArray(palates)) {
    return palates.map(p => {
      if (typeof p === 'string') return p.trim().toLowerCase();
      if (typeof p === 'object' && p !== null && 'name' in p) {
        return String(p.name).trim().toLowerCase();
      }
      return String(p).trim().toLowerCase();
    }).filter(Boolean);
  }
  
  if (typeof palates === 'string') {
    return palates.split('|').map(p => p.trim().toLowerCase()).filter(Boolean);
  }
  
  return [];
}

/**
 * Check if two palate sets have any matching palates
 * @param palates1 - First set of palates
 * @param palates2 - Second set of palates
 * @returns True if any palates match
 */
export function hasMatchingPalates(
  palates1: string | string[] | any[] | null | undefined,
  palates2: string | string[] | any[] | null | undefined
): boolean {
  const normalized1 = normalizePalates(palates1);
  const normalized2 = normalizePalates(palates2);
  
  if (normalized1.length === 0 || normalized2.length === 0) {
    return false;
  }
  
  return normalized1.some(palate1 => 
    normalized2.some(palate2 => 
      palate1.includes(palate2) || palate2.includes(palate1)
    )
  );
}

/**
 * Calculate similarity score between two palate sets (0-1)
 * Returns 1 if all palates match, 0 if none match
 * @param palates1 - First set of palates
 * @param palates2 - Second set of palates
 * @returns Similarity score between 0 and 1
 */
export function calculatePalateSimilarity(
  palates1: string | string[] | any[] | null | undefined,
  palates2: string | string[] | any[] | null | undefined
): number {
  const normalized1 = normalizePalates(palates1);
  const normalized2 = normalizePalates(palates2);
  
  if (normalized1.length === 0 || normalized2.length === 0) {
    return 0;
  }
  
  const matches = normalized1.filter(palate1 => 
    normalized2.some(palate2 => 
      palate1.includes(palate2) || palate2.includes(palate1)
    )
  ).length;
  
  const totalUnique = new Set([...normalized1, ...normalized2]).size;
  
  return totalUnique > 0 ? matches / totalUnique : 0;
}

