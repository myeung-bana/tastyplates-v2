import { PrivacyPolicyRepository } from "@/repositories/http/PrivacyPolicy/privacyPolicyRepository";
import { PrivacyPolicyRepo } from "@/repositories/interface/user/privacyPolicy";

const privacyPolicyRepo: PrivacyPolicyRepo = new PrivacyPolicyRepository()

export class PrivacyPolicyService {
  async getPrivacyPolicy() {
    const res = await privacyPolicyRepo.fetchPrivacyPolicy();

    if (!res.ok) throw new Error("Failed to fetch Privacy Policy");

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return { title: data.title, content: data.content };
  }
}
