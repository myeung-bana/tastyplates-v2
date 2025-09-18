export interface PrivacyPolicyRepo {
    fetchPrivacyPolicy(): Promise<Record<string, unknown>>;
}