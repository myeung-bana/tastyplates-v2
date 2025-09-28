import { TermsOfServiceRepository } from "@/repositories/http/TermsOfService/termsOfServiceRepository";
import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";

const termsOfServiceRepo: TermsOfServiceRepo = new TermsOfServiceRepository();

export class TermsOfServiceService {
  async getTermsOfService() {
    const data = await termsOfServiceRepo.fetchTermsOfService();

    if (data.error) throw new Error(String(data.error));

    return { title: data.title, content: data.content };
  }
}
