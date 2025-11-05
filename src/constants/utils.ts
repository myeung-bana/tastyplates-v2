
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
  REGIONAL_PALATE_GROUPS: {
    "East Asian": ["Chinese", "Japanese", "Korean", "Mongolian", "Taiwanese"],
    "South Asian": ["Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepalese", "Afghan"],
    "South East Asian": ["Thai", "Vietnamese", "Indonesian", "Malaysian", "Filipino", "Singaporean", "Cambodian", "Laotian", "Myanmar"],
    "Middle Eastern": ["Turkish", "Lebanese", "Iranian", "Israeli", "Syrian", "Jordanian", "Iraqi", "Egyptian", "Moroccan"],
    "African": ["Ethiopian", "Nigerian", "South African", "Moroccan", "Egyptian", "Kenyan", "Ghanaian", "Senegalese"],
    "North American": ["American", "Canadian", "Mexican", "Cuban", "Jamaican", "Haitian", "Dominican"],
    "European": ["Italian", "French", "Spanish", "German", "British", "Greek", "Portuguese", "Polish", "Russian", "Swedish", "Norwegian", "Dutch", "Belgian", "Swiss", "Austrian"],
    "Oceanic": ["Australian", "New Zealand", "Fijian", "Tongan", "Samoan", "Hawaiian"]
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