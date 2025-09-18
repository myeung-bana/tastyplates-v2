export interface PalateRepo {
    getPalates(): Promise<Record<string, unknown>>;
}