import { TermsOfServiceRepository } from "@/repositories/http/TermsOfService/termsOfServiceRepository";
import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";

const termsOfServiceRepo: TermsOfServiceRepo = new TermsOfServiceRepository();

export class TermsOfServiceService {
  async getTermsOfService() {
    const res = await termsOfServiceRepo.fetchTermsOfService();

    if (!res.ok) throw new Error("Failed to fetch Terms of Service");

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return { title: data.title, content: data.content };
  }
}
