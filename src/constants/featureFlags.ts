// featureFlags.ts - Feature flags for gradual migration and A/B testing

/**
 * Feature flags configuration
 * Set these to true to enable new features/APIs
 */

export const FEATURE_FLAGS = {
  // Restaurant API Migration
  USE_RESTAURANT_V2_API: process.env.NEXT_PUBLIC_USE_RESTAURANT_V2_API === 'true' || false,
  
  // Other feature flags can be added here
} as const;

/**
 * Check if a feature flag is enabled
 */
export const isFeatureEnabled = (flag: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[flag];
};

/**
 * Get feature flag value
 */
export const getFeatureFlag = (flag: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[flag];
};

