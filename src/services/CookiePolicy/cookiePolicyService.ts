import { CookiePolicyRepository } from "@/repositories/http/CookiePolicy/cookiePolicyRepository";
import { CookiePolicyRepo } from "@/repositories/interface/user/cookiePolicy";

const cookiePolicyRepo: CookiePolicyRepo = new CookiePolicyRepository();

export class CookiePolicyService {
  async getCookiePolicy() {
    const response = await cookiePolicyRepo.fetchCookiePolicy();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((response as any).error) throw new Error((response as any).error);

    // Extract data from API response structure: { success: true, data: { title, content } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (response as any).data || response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { title: (data as any).title, content: (data as any).content };
  }
}

