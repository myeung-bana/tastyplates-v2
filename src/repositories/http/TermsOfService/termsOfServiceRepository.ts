import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";

export class TermsOfServiceRepository implements TermsOfServiceRepo {
  async fetchTermsOfService() {
    try {
      // Fetch from Next.js API route that reads markdown
      const response = await fetch('/api/v1/content/terms-of-service', { 
        cache: "no-store" 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch terms of service: ${response.statusText}`);
      }
      
      return await response.json() as Record<string, unknown>;
    } catch (error) {
      console.error('Error fetching terms of service:', error);
      throw error;
    }
  }
}
