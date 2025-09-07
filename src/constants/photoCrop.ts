export const PHOTO_CROP_CONSTANTS = {
  MAX_SCALE: 3,
  CROP_DIAMETER: 240, // Fixed 240x240 crop frame for better quality
  MIN_IMAGE_REQUIREMENTS: {
    width: 240,
    height: 240,
    aspectRatioMin: 0.5, // 1:2
    aspectRatioMax: 2.0, // 2:1
  },
} as const;

export type PhotoCropConstants = typeof PHOTO_CROP_CONSTANTS;
