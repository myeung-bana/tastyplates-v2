import { REVIEWS_VIEWER } from '@/constants/pages';

export type ReviewViewerSource =
  | { src: 'global' }
  | { src: 'following' }
  | { src: 'restaurant'; restaurantUuid: string }
  | { src: 'user'; userId: string; status?: string };

export interface ReviewViewerUrlParams extends ReviewViewerSource {
  offset: number;
  /** Optional fallback when opened in a new tab with no history */
  returnTo?: string;
}

export function buildReviewViewerUrl(params: ReviewViewerUrlParams): string {
  const sp = new URLSearchParams();
  sp.set('src', params.src);
  sp.set('offset', String(Math.max(0, params.offset)));

  if (params.src === 'restaurant') sp.set('restaurantUuid', params.restaurantUuid);
  if (params.src === 'user') {
    sp.set('userId', params.userId);
    if (params.status) sp.set('status', params.status);
  }
  if (params.returnTo) sp.set('returnTo', params.returnTo);

  return `${REVIEWS_VIEWER}?${sp.toString()}`;
}

