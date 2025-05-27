export interface CuisineNode {
    id: string;
    name: string;
}

export interface Cuisines {
    nodes: CuisineNode[];
}

export interface AllCuisines {
    cuisines: Cuisines;
}