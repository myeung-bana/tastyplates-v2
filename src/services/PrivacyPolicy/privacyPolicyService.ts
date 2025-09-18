import { PrivacyPolicyRepository } from "@/repositories/http/PrivacyPolicy/privacyPolicyRepository";
import { PrivacyPolicyRepo } from "@/repositories/interface/user/privacyPolicy";

const privacyPolicyRepo: PrivacyPolicyRepo = new PrivacyPolicyRepository()

export class PrivacyPolicyService {
  async getPrivacyPolicy() {
    const data = await privacyPolicyRepo.fetchPrivacyPolicy();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as any).error) throw new Error((data as any).error);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { title: (data as any).title, content: (data as any).content };
  }
}
