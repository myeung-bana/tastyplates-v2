import { ContentGuidelinesRepo } from "@/repositories/interface/user/contentGuidelines";

export class ContentGuidelinesRepository implements ContentGuidelinesRepo {
  async fetchContentGuidelines() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/content-guidelines`,
      { cache: "no-store" }
    );
    return await response.json() as Record<string, unknown>;
  }
}
