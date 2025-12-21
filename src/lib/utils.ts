import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripTags(input: string): string {
  const stripped = input.replace(/<[^>]*>?/gm, '');

  const txt = document.createElement("textarea");
  txt.innerHTML = stripped;
  return txt.value;
}

export function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim();
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const [datePart] = dateString.split(' ');
  if (!datePart) return '';
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

export function formatDateT(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const [datePart] = dateString.split('T');
  if (!datePart) return '';
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

export function formatDateForInput(dateString: string): string {
  console.log("formatDateForInput called with:", dateString);
  if (!dateString) return '';

  let year: number, month: number, day: number;

  if (dateString.includes('/')) {
    // MM/DD/YYYY
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    const [monthStr, dayStr, yearStr] = parts;
    if (!monthStr || !dayStr || !yearStr) return '';
    month = Number(monthStr);
    day = Number(dayStr);
    year = Number(yearStr);
  } else if (dateString.includes('-')) {
    // YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const [yearStr, monthStr, dayStr] = parts;
    if (!yearStr || !monthStr || !dayStr) return '';
    year = Number(yearStr);
    month = Number(monthStr);
    day = Number(dayStr);
  } else {
    return '';
  }

  const localDate = new Date(year, month - 1, day);

  // Format to YYYY-MM-DD
  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, '0');
  const dd = String(localDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

export function capitalizeWords(str: string): string {
  return str
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

//ex: PAGE(DASHBOARD, ["path", "list"], { status: true }) returns "/dashboard/path/list?status=true"
export const PAGE = (
  basePath: string,
  subPaths: string[] = [],
  params?: Record<string, unknown> | string
): string => {
  const path = [basePath, ...subPaths].join("/").replace(/\/+/g, "/");

  // If params is a string, assume it's already URLSearchParams-style
  if (typeof params === "string") {
    return params ? `${path}?${params}` : path;
  }

  // Otherwise, treat as object and serialize
  const query = new URLSearchParams(
    Object.entries(params || {}).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return query ? `${path}?${query}` : path;
};

export const capitalizeFirstLetter = (string: string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const validEmail = (email: string): boolean => {
  // Simple email regex
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates a username according to standard username policy
 * Rules:
 * - 3-20 characters in length
 * - Only letters (a-z, A-Z), numbers (0-9), underscores (_), and hyphens (-)
 * - Cannot start or end with underscore or hyphen
 * - Cannot contain spaces
 * - Cannot be all numbers
 * - Cannot contain consecutive special characters (__ or -- or _- or -_)
 * 
 * @param username - The username to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateUsername = (username: string): UsernameValidationResult => {
  // Trim whitespace
  const trimmed = username.trim();

  // Check if empty
  if (!trimmed) {
    return {
      isValid: false,
      error: "usernameRequired"
    };
  }

  // Check length (3-20 characters)
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: "usernameTooShort"
    };
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      error: "usernameTooLong"
    };
  }

  // Check for spaces
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: "usernameNoSpaces"
    };
  }

  // Check for allowed characters only (letters, numbers, underscore, hyphen)
  const allowedPattern = /^[a-zA-Z0-9_-]+$/;
  if (!allowedPattern.test(trimmed)) {
    return {
      isValid: false,
      error: "usernameInvalidCharacters"
    };
  }

  // Cannot start with underscore or hyphen
  if (/^[_-]/.test(trimmed)) {
    return {
      isValid: false,
      error: "usernameCannotStartWithSpecial"
    };
  }

  // Cannot end with underscore or hyphen
  if (/[_-]$/.test(trimmed)) {
    return {
      isValid: false,
      error: "usernameCannotEndWithSpecial"
    };
  }

  // Cannot be all numbers
  if (/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "usernameCannotBeAllNumbers"
    };
  }

  // Cannot contain consecutive special characters
  if (/[_-]{2,}/.test(trimmed)) {
    return {
      isValid: false,
      error: "usernameNoConsecutiveSpecial"
    };
  }

  // All validations passed
  return {
    isValid: true
  };
};

// Profile ID encoding/decoding utilities
export const encodeUserId = (userId: string): string => {
  if (typeof window !== 'undefined' && window.btoa) {
    // Browser environment
    return window.btoa(`user:${userId}`).replace(/[+/=]/g, (match) => {
      switch (match) {
        case '+': return '-';
        case '/': return '_';
        case '=': return '';
        default: return match;
      }
    });
  } else if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(`user:${userId}`)
      .toString('base64')
      .replace(/[+/=]/g, (match) => {
        switch (match) {
          case '+': return '-';
          case '/': return '_';
          case '=': return '';
          default: return match;
        }
      });
  }
  // Fallback to simple encoding
  return btoa(`user:${userId}`).replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
};

export const decodeUserId = (encodedId: string): string => {
  try {
    // Restore base64 characters
    const base64 = encodedId.replace(/[-_]/g, (match) => {
      switch (match) {
        case '-': return '+';
        case '_': return '/';
        default: return match;
      }
    });

    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

    let decoded: string;
    if (typeof window !== 'undefined' && window.atob) {
      // Browser environment
      decoded = window.atob(padded);
    } else if (typeof Buffer !== 'undefined') {
      // Node.js environment
      decoded = Buffer.from(padded, 'base64').toString();
    } else {
      // Fallback
      decoded = atob(padded);
    }

    // Extract user ID from "user:123" format
    const match = decoded.match(/^user:(\d+)$/);
    if (match) {
      return match[1];
    }
    
    throw new Error('Invalid encoded user ID format');
  } catch (error) {
    throw new Error(`Failed to decode user ID: ${error}`);
  }
};

// Enhanced profile URL generation - supports username or userId
// If username is provided, use it directly. Otherwise, use userId (for backward compatibility)
export const generateProfileUrl = (identifier: string | number, username?: string): string => {
  // If username is explicitly provided, use it
  if (username) {
    return `/profile/${encodeURIComponent(username)}`;
  }
  
  const identifierStr = String(identifier);
  if (!identifierStr || identifierStr === "undefined" || identifierStr === "null") {
    return "";
  }

  // Detect if identifier is a username (not UUID, not numeric)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifierStr);
  const isNumeric = /^\d+$/.test(identifierStr);
  const isUsername = !isUUID && !isNumeric && /^[a-zA-Z0-9._-]+$/.test(identifierStr);
  
  if (isUsername) {
    // Use username directly (URL-encode for safety)
    return `/profile/${encodeURIComponent(identifierStr)}`;
  }
  
  // For UUID or numeric ID, encode it for backward compatibility
  // Note: This maintains backward compatibility with old encoded URLs
  const encodedId = encodeUserId(identifierStr);
  return `/profile/${encodedId}`;
};

// Enhanced profile URL parsing - supports both username and encoded userId
export const parseProfileUrl = (userParam: string): string | null => {
  if (!userParam) return null;
  
  const trimmed = userParam.trim();
  
  // If it looks like a username (not encoded, not UUID, not numeric), return as-is
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
  const isNumeric = /^\d+$/.test(trimmed);
  const isUsername = !isUUID && !isNumeric && /^[a-zA-Z0-9._-]+$/.test(trimmed);
  
  if (isUsername) {
    return trimmed; // Return username as-is
  }
  
  // Try to decode as encoded ID (backward compatibility)
  try {
    const decodedId = decodeUserId(trimmed);
    const userId = parseInt(decodedId);
    return !isNaN(userId) && userId > 0 ? String(userId) : null;
  } catch (error) {
    // If decoding fails, try parsing as a direct number (backward compatibility)
    console.warn('Failed to decode profile URL, trying direct parse:', error);
    const userId = parseInt(trimmed);
    return !isNaN(userId) && userId > 0 ? String(userId) : null;
  }
};