import { ContentGuidelinesRepository } from "@/repositories/http/ContentGuidelines/contentGuidelinesRepository";
import { ContentGuidelinesRepo } from "@/repositories/interface/user/contentGuidelines";

const contentGuidelinesRepo: ContentGuidelinesRepo = new ContentGuidelinesRepository()

export class ContentGuidelinesService {
  async getContentGuidelines() {
    const data = await contentGuidelinesRepo.fetchContentGuidelines();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as any).error) throw new Error((data as any).error);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { title: (data as any).title, content: (data as any).content };
  }
}
