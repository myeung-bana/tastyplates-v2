export interface CookiePolicyRepo {
  fetchCookiePolicy(): Promise<Record<string, unknown>>;
}

