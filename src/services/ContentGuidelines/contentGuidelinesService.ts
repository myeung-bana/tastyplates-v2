import { ContentGuidelinesRepository } from "@/repositories/http/ContentGuidelines/contentGuidelinesRepository";
import { ContentGuidelinesRepo } from "@/repositories/interface/user/contentGuidelines";

const contentGuidelinesRepo: ContentGuidelinesRepo = new ContentGuidelinesRepository()

export class ContentGuidelinesService {
  async getContentGuidelines() {
    const res: Response = await contentGuidelinesRepo.fetchContentGuidelines();

    if (!res.ok) throw new Error("Failed to fetch Content Guidelines");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return { title: data.title, content: data.content };
  }
}
