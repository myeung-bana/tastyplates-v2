export interface Listing {
    id: string;
    title: string;
    slug: string;
    content: string;
    listingStreet: string;
    palates: {
        nodes: {
            name: string;
        }[];
    };
    databaseId?: number;
    listingDetails: {
        googleMapUrl: {
            latitude: string
            longitude: string
            streetAddress: string
        }
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
    listingCategories: {
        nodes: {
            databaseId: number
            name: string
        }[];
    };
    countries: {
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