export interface TermsOfServiceRepo {
    fetchTermsOfService(): Promise<Response>;
}