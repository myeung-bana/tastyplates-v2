/**
 * Cursor encoding/decoding for stable (created_at, id) pagination.
 * Uses base64url(JSON) for URL-safe opaque cursors.
 */

export interface ReviewCursorPayload {
  created_at: string;
  id: string;
}

export function encodeReviewCursor(created_at: string, id: string): string {
  const payload: ReviewCursorPayload = { created_at, id };
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeReviewCursor(cursor: string): ReviewCursorPayload | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as ReviewCursorPayload;
    if (typeof parsed?.created_at === 'string' && typeof parsed?.id === 'string') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export interface RestaurantCursorPayload {
  created_at: string;
  id: number;
}

export function encodeRestaurantCursor(created_at: string, id: number): string {
  const payload: RestaurantCursorPayload = { created_at, id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeRestaurantCursor(cursor: string): RestaurantCursorPayload | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as RestaurantCursorPayload;
    if (typeof parsed?.created_at === 'string' && typeof parsed?.id === 'number') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}
