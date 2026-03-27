
export const checkImageType = (image: string) => {
    return (/\.(gif|jpe?g|tiff?|png|webp|bmp|svg)$/i).test(image)
}

// Restaurant-related constants
export const RESTAURANT_CONSTANTS = {
  // Pagination settings
  DEFAULT_RESULTS_PER_PAGE: 8,
  INITIAL_LOAD_RESULTS: 100, // Increased to improve location filtering results (e.g., Hong Kong)
  SUGGESTED_RESULTS_THRESHOLD: 10, // Show suggestions if results < 10
  SUGGESTED_RESULTS_COUNT: 4, // Number of suggested restaurants to show
  
  // Regional palate groupings for suggestions
  // Values are canonical palate slugs (lowercase, hyphenated) — must match `palateOptions` child keys and DB `palates[].slug`
  REGIONAL_PALATE_GROUPS: {
    "East Asian": ["chinese", "japanese", "korean", "taiwanese"],
    "South Asian": ["nepalese", "bangladesh", "sri-lankan", "maldivian", "indian", "pakistani"],
    "South East Asian": ["malaysian", "filipino", "singaporean", "indonesian"],
    "Middle Eastern": ["armenian", "east-arabian", "lebanese", "caucasian", "iranian", "turkish"],
    "African": ["angolan", "congolese", "ethiopian", "kenyan", "zimbabwean", "egyptian", "algerian", "ghanaian", "nigerian"],
    "North American": ["canadian", "mexican", "american"],
    "European": ["british", "spanish", "italian", "french", "german", "russian", "danish", "finnish", "swedish", "romanian", "greek", "portuguese"],
    "Oceanic": ["australian", "polynesian"],
  },
  
  // UI text
  SUGGESTED_SECTION_TITLE: "Suggested Restaurants",
  SUGGESTED_SECTION_SUBTITLE: "More restaurants reviewed by users in your region",
  NO_RESULTS_MESSAGE: "No restaurants found with your current filters",
  LOADING_MESSAGE: "Loading restaurants...",
} as const;

// Helper function to get regional palates for suggestions
export const getRegionalPalatesForSuggestions = (selectedPalates: string[]): string[] => {
  if (!selectedPalates || selectedPalates.length === 0) return [];
  
  const { REGIONAL_PALATE_GROUPS } = RESTAURANT_CONSTANTS;
  const suggestedPalates: string[] = [];
  
  // Find which region(s) the selected palates belong to
  const selectedRegions = new Set<string>();
  selectedPalates.forEach(palate => {
    Object.entries(REGIONAL_PALATE_GROUPS).forEach(([region, palates]) => {
      if ((palates as readonly string[]).includes(palate)) {
        selectedRegions.add(region);
      }
    });
  });
  
  // Get all palates from the selected regions, excluding the originally selected ones
  selectedRegions.forEach(region => {
    const regionPalates = REGIONAL_PALATE_GROUPS[region as keyof typeof REGIONAL_PALATE_GROUPS];
    (regionPalates as readonly string[]).forEach(palate => {
      if (!selectedPalates.includes(palate) && !suggestedPalates.includes(palate)) {
        suggestedPalates.push(palate);
      }
    });
  });
  
  return suggestedPalates;
};

// Helper function to check if suggestions should be shown
export const shouldShowSuggestions = (resultCount: number): boolean => {
  return resultCount < RESTAURANT_CONSTANTS.SUGGESTED_RESULTS_THRESHOLD;
};