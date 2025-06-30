export interface PalatesNode {
    id: string;
    name: string;
}

export interface Palates {
    nodes: PalatesNode[];
}

export interface AllPalates {
    palates: Palates;
}