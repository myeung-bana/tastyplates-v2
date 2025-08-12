import { fetchPrivacyPolicy } from "@/repositories/PrivacyPolicy/privacypolicyRepository";

export async function getPrivacyPolicy() {
  return await fetchPrivacyPolicy();
}
