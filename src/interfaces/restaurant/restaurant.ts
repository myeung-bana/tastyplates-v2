export interface Listing {
    id: string;
    title: string;
    slug: string;
    address: string;
    content: string;
    listingStreet: string;
    fieldMultiCheck90: string;
    listingDetails: {
        googleMapUrl: string;
        latitude: string;
        longitude: string;
        menuUrl: string;
        openingHours: string;
        phone: string;
    };
    featuredImage?: {
        node: {
            sourceUrl: string;
        };
    };
    cuisines: {
        nodes: {
            id: string
            name: string
        }[];
    };
    locations: {
        nodes: { name: string }[];
    };
}


export interface GetListingsData {
    listings: {
        nodes: Listing[];
        pageInfo: {
            endCursor: string;
            hasNextPage: boolean;
        };
    };
}

export interface GetListingBySlugData {
    listing: Listing | null;
}