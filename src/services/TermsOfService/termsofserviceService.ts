import { fetchTermsOfService } from "@/repositories/TermsOfService/termsofserviceRepository";

export async function getTermsOfService() {
  return await fetchTermsOfService();
}
