import { TermsOfServiceRepository } from "@/repositories/http/TermsOfService/termsOfServiceRepository";
import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";

const categoryRepo: TermsOfServiceRepo = new TermsOfServiceRepository();

export class TermsOfServiceService {
  async getTermsOfService() {
    return await categoryRepo.fetchTermsOfService();
  }
}
