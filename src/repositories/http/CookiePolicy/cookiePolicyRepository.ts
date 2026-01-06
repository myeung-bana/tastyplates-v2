import { CookiePolicyRepo } from "@/repositories/interface/user/cookiePolicy";

export class CookiePolicyRepository implements CookiePolicyRepo {
  async fetchCookiePolicy() {
    try {
      // Fetch from Next.js API route that reads markdown
      const response = await fetch('/api/v1/content/cookie-policy', { 
        cache: "no-store" 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cookie policy: ${response.statusText}`);
      }
      
      return await response.json() as Record<string, unknown>;
    } catch (error) {
      console.error('Error fetching cookie policy:', error);
      throw error;
    }
  }
}

