import { TermsOfServiceRepo } from "@/repositories/interface/user/termsOfService";

export class TermsOfServiceRepository implements TermsOfServiceRepo {
  async fetchTermsOfService() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/terms-of-service`,
      { cache: "no-store" }
    );
    return await response.json() as Record<string, unknown>;
  }
}
