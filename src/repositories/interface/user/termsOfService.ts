export interface TermsOfServiceRepo {
    fetchTermsOfService(): Promise<Record<string, unknown>>;
}