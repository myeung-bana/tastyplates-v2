import { ContentGuidelinesRepo } from "@/repositories/interface/user/contentGuidelines";

export class ContentGuidelinesRepository implements ContentGuidelinesRepo {
  async fetchContentGuidelines() {
    return fetch(
      `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/content-guidelines`,
      { cache: "no-store" }
    );
  }
}
