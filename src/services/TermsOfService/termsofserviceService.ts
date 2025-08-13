import { TermsOfServiceRepository } from "@/repositories/http/TermsOfService/termsofserviceRepository";
import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";

const categoryRepo: TermsOfServiceRepo = new TermsOfServiceRepository();

export class TermsOfServiceService {
  async getTermsOfService() {
    return await categoryRepo.fetchTermsOfService();
  }
}
