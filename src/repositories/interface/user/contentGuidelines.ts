export interface ContentGuidelinesRepo {
    fetchContentGuidelines(): Promise<Record<string, unknown>>;
}