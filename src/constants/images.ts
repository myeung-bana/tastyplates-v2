// Default Images
export const DEFAULT_USER_IMAGE = "/images/default-user-profile.jpg";
export const DEFAULT_USER_ICON = "/profile-icon.svg";
export const DEFAULT_IMAGE = "/images/tastyplates_placeholder_portrait.jpg"; // Deprecated - use DEFAULT_REVIEW_IMAGE or DEFAULT_RESTAURANT_IMAGE
export const DEFAULT_REVIEW_IMAGE = "/images/tastyplates_placeholder_portrait.jpg";
export const DEFAULT_RESTAURANT_IMAGE = "/images/tastyplates_placeholder_landscape.jpg";
/** Article cards & article detail hero when no featured image from CMS/API */
export const DEFAULT_ARTICLE_COVER_IMAGE = "/images/tastyplates_placeholder_landscape.jpg";
/** Fallback for RestaurantCard only when API returns no image or load fails. Use DB default URL via env. */
export const DEFAULT_RESTAURANT_CARD_IMAGE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEFAULT_RESTAURANT_IMAGE_URL) ||
  "/images/tastyplates_placeholder_landscape.jpg";

// Flag icons
export const FLAG = "/flag.svg";

// Social icons
export const PHONE = "/phone.svg";
export const CASH = "/cash.svg";
export const HELMET = "/helmet.svg";

// Community recognition icons (PNG)
export const COMMUNITY_MUST_REVISIT = "/icons/must-revisit.png";
export const COMMUNITY_INSTA_WORTHY = "/icons/insta-worthy.png";
export const COMMUNITY_VALUE_FOR_MONEY = "/icons/value-for-money.png";
export const COMMUNITY_GOOD_SERVICE = "/icons/good-service.png";
export const FACEBOOK = "/facebook.svg";
export const INSTAGRAM = "/instagram.svg";
export const TWITTER = "/x.svg";
export const STAR = "/star.svg";
export const STAR_FILLED = "/star-filled.svg";
export const STAR_HALF = "/star-half.svg";
export const ARROW_WARM_UP = "/images/arrow_warm_up.svg";

export const LISTING_BACKDROP_SP = "/images/Iisting-backdrop-sp.png";
export const HERO_BG = "/images/hero-bg.png";
export const HERO_BG_SP = "/images/hero-bg-sp.png";
export const TASTYPLATES_LOGO_WHITE = "/TastyPlates_Logo_White.svg";
export const TASTYPLATES_LOGO_BLACK = "/TastyPlates_Logo_Black.svg";
export const TASTYPLATES_LOGO_COLOUR = "/TastyPlates_Logo_Colour.svg";