import { Cuisine } from '@/app/api/v1/services/cuisineService';

export interface CuisineOption {
  key: string;
  label: string;
  flag?: string;
  children?: CuisineOption[];
}

/**
 * Transforms flat cuisine array into hierarchical structure for CustomMultipleSelect
 * Groups children under their parent cuisines
 */
export const transformCuisinesToOptions = (cuisines: Cuisine[]): CuisineOption[] => {
  // Separate parents and children
  const parents = cuisines.filter(c => !c.parent_id);
  const children = cuisines.filter(c => c.parent_id);

  // Create a map of parent_id -> children
  const childrenMap = new Map<number, Cuisine[]>();
  children.forEach(child => {
    if (child.parent_id) {
      const existing = childrenMap.get(child.parent_id) || [];
      existing.push(child);
      childrenMap.set(child.parent_id, existing);
    }
  });

  // Transform to the expected format
  return parents.map(parent => ({
    key: parent.slug || parent.name.toLowerCase().replace(/\s+/g, '-'),
    label: parent.name,
    children: childrenMap.get(parent.id)?.map(child => ({
      key: child.slug || child.name.toLowerCase().replace(/\s+/g, '-'),
      label: child.name,
      flag: child.flag_url || undefined,
    })),
  }));
};

/**
 * Helper to get cuisine key from name or slug
 */
export const getCuisineKey = (cuisine: Cuisine | string): string => {
  if (typeof cuisine === 'string') {
    return cuisine.toLowerCase().replace(/\s+/g, '-');
  }
  return cuisine.slug || cuisine.name.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Flatten cuisine options to a single array (useful for search/filter)
 */
export const flattenCuisineOptions = (options: CuisineOption[]): CuisineOption[] => {
  const flattened: CuisineOption[] = [];
  
  options.forEach(option => {
    // Add parent if it has no children (standalone option)
    if (!option.children || option.children.length === 0) {
      flattened.push(option);
    } else {
      // Add all children
      flattened.push(...option.children);
    }
  });
  
  return flattened;
};

/**
 * Find cuisine option by key (searches both parents and children)
 */
export const findCuisineOptionByKey = (
  options: CuisineOption[],
  key: string
): CuisineOption | undefined => {
  for (const option of options) {
    if (option.key === key) {
      return option;
    }
    if (option.children) {
      const found = option.children.find(child => child.key === key);
      if (found) return found;
    }
  }
  return undefined;
};

