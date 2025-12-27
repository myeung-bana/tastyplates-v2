import { ContentGuidelinesRepo } from "@/repositories/interface/user/contentGuidelines";

export class ContentGuidelinesRepository implements ContentGuidelinesRepo {
  async fetchContentGuidelines() {
    try {
      // Fetch from Next.js API route that reads markdown
      const response = await fetch('/api/v1/content/content-guidelines', { 
        cache: "no-store" 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content guidelines: ${response.statusText}`);
      }
      
      return await response.json() as Record<string, unknown>;
    } catch (error) {
      console.error('Error fetching content guidelines:', error);
      throw error;
    }
  }
}
