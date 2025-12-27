import { PrivacyPolicyRepo } from "@/repositories/interface/user/privacyPolicy";

export class PrivacyPolicyRepository implements PrivacyPolicyRepo {
  async fetchPrivacyPolicy() {
    try {
      // Fetch from Next.js API route that reads markdown
      const response = await fetch('/api/v1/content/privacy-policy', { 
        cache: "no-store" 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch privacy policy: ${response.statusText}`);
      }
      
      return await response.json() as Record<string, unknown>;
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      throw error;
    }
  }
}
