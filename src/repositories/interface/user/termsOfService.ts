export interface TermsOfServiceRepo {
    fetchTermsOfService(): Promise<{ title: string; content: string }>;
}