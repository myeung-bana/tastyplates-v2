import { PrivacyPolicyRepo } from "@/repositories/interface/user/privacyPolicy";

export class PrivacyPolicyRepository implements PrivacyPolicyRepo {
  async fetchPrivacyPolicy() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/v1/privacy-policy`,
      { cache: "no-store" }
    );
    return await response.json() as Record<string, unknown>;
  }
}
